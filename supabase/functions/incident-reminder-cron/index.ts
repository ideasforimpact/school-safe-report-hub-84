import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CronJobRequest {
  action: 'check_reminders';
  clientId?: string;
  days?: number;
}

interface CronJobResponse {
  success: boolean;
  message: string;
  processedCount?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Incident Reminder Cron Job: Starting execution");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, clientId, days = 10 }: CronJobRequest = await req.json();

    if (action !== 'check_reminders') {
      throw new Error('Invalid action specified');
    }

    console.log(`Checking for incidents open for more than ${days} days`);

    // Get all clients if no specific clientId provided
    let clients: any[] = [];
    
    if (clientId) {
      // Get specific client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        throw new Error(`Client not found: ${clientId}`);
      }
      
      clients = [client];
    } else {
      // Get all active clients
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', true);

      if (clientsError) {
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }
      
      clients = allClients || [];
    }

    let totalProcessed = 0;

    // Process each client
    for (const client of clients) {
      console.log(`Processing client: ${client.name} (${client.id})`);
      
      const processedCount = await processClientIncidents(supabase, client.id, days);
      totalProcessed += processedCount;
      
      console.log(`Processed ${processedCount} incidents for client ${client.name}`);
    }

    console.log("Incident Reminder Cron Job: Completed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${totalProcessed} incident reminders`,
        processedCount: totalProcessed
      } as CronJobResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in incident-reminder-cron function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to process incident reminders",
        error: error.message || 'Unknown error occurred'
      } as CronJobResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Process incidents for a specific client
 */
async function processClientIncidents(supabase: any, clientId: string, days: number): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    console.log(`Looking for incidents created before: ${cutoffDate.toISOString()}`);

    // Get incidents that are open for more than specified days
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select(`
        id,
        ticket_id,
        description,
        created_at,
        assigned_to,
        status:incident_status(name)
      `)
      .eq('client_id', clientId)
      .lt('created_at', cutoffDate.toISOString())
      .neq('status', 'Closed');

    if (error) {
      console.error(`Error fetching incidents for client ${clientId}:`, error);
      return 0;
    }

    if (!incidents || incidents.length === 0) {
      console.log(`No old incidents found for client ${clientId}`);
      return 0;
    }

    console.log(`Found ${incidents.length} incidents open for more than ${days} days`);

    let processedCount = 0;

    // Process each incident
    for (const incident of incidents) {
      try {
        // Check if we already sent a reminder recently (within last 24 hours)
        const { data: recentReminders, error: reminderError } = await supabase
          .from('notification_logs')
          .select('created_at')
          .eq('module', 'incident')
          .eq('type', 'incident_reminder_10_days')
          .eq('metadata->incidentId', incident.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (reminderError) {
          console.error(`Error checking recent reminders for incident ${incident.id}:`, reminderError);
          continue;
        }

        // Skip if we already sent a reminder recently
        if (recentReminders && recentReminders.length > 0) {
          console.log(`Skipping incident ${incident.id} - reminder already sent recently`);
          continue;
        }

        // Get assigned employee details
        if (!incident.assigned_to) {
          console.log(`Skipping incident ${incident.id} - no assignee`);
          continue;
        }

        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('id, email, first_name, last_name, status')
          .eq('id', incident.assigned_to)
          .single();

        if (employeeError || !employee) {
          console.log(`Skipping incident ${incident.id} - assignee not found`);
          continue;
        }

        if (!employee.status) {
          console.log(`Skipping incident ${incident.id} - assignee is inactive`);
          continue;
        }

        if (!employee.email) {
          console.log(`Skipping incident ${incident.id} - assignee has no email`);
          continue;
        }

        // Send reminder notification
        const success = await sendReminderNotification(supabase, {
          incident,
          employee,
          days
        });

        if (success) {
          processedCount++;
          console.log(`Sent reminder for incident ${incident.id} to ${employee.email}`);
        }

      } catch (incidentError) {
        console.error(`Error processing incident ${incident.id}:`, incidentError);
      }
    }

    return processedCount;

  } catch (error) {
    console.error(`Error processing incidents for client ${clientId}:`, error);
    return 0;
  }
}

/**
 * Send reminder notification for an incident
 */
async function sendReminderNotification(supabase: any, data: {
  incident: any;
  employee: any;
  days: number;
}): Promise<boolean> {
  try {
    const { incident, employee, days } = data;

    // Prepare email variables
    const variables = {
      User_Name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email,
      Incident_ID: incident.ticket_id,
      Incident_Title: incident.description || 'Incident',
      Reported_Date: new Date(incident.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Get notification template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('module', 'incident')
      .eq('type', 'incident_reminder_10_days')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('No reminder template found');
      return false;
    }

    // Process template
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Send email
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
      body: {
        to: employee.email,
        toName: variables.User_Name,
        subject,
        body,
        priority: 'high'
      }
    });

    if (emailError || !emailResult?.success) {
      console.error('Failed to send reminder email:', emailError || emailResult);
      return false;
    }

    // Log the notification
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert([{
        module: 'incident',
        type: 'incident_reminder_10_days',
        recipient_id: employee.id,
        recipient_email: employee.email,
        subject,
        body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          incidentId: incident.id,
          daysOpen: days
        }
      }]);

    if (logError) {
      console.error('Error logging reminder notification:', logError);
    }

    return true;

  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return false;
  }
} 