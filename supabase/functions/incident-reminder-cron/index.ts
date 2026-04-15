import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};



interface CronJobResponse {
  success: boolean;
  message: string;
  processedCount?: number;
  failedCount?: number;
  skippedCount?: number;
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
    
    // Fixed days threshold - no need to rely on request
    const days = 10;

    console.log(`Processing incident reminders for emails with days threshold: ${days}`);

    // Fetch active email_queue entries that haven't had remainder cron started
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('active', true)
      .eq('is_remainder_cron_started', false)
      .eq('module_name', 'incident') // Only process incident-related emails
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch pending emails: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No pending incident emails found for remainder processing");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending incident emails found for remainder processing",
          processedCount: 0,
          failedCount: 0,
          skippedCount: 0
        } as CronJobResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingEmails.length} pending incident emails to process`);

    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`Processing email ID: ${email.id} for incident notification`);

        // Validate incident notification - same logic as process-email-queue
        const validationResult = await validateIncidentNotification(supabase, email);
        if (!validationResult.isValid) {
          console.log(`Validation failed for email ${email.id}: ${validationResult.reason}`);
          await updateRemainderStatus(supabase, email.id, false, validationResult.reason);
          failedCount++;
          continue;
        }

        // Extract Incident_ID from params to check the 10-day rule
        const incidentId = email.params?.Incident_ID;
        if (!incidentId) {
          console.log(`No Incident_ID found in params for email ${email.id}`);
          await updateRemainderStatus(supabase, email.id, false, 'Missing Incident_ID in params');
          failedCount++;
          continue;
        }

        // Check if incident meets the day threshold (10 days old)
        const dayCheckResult = await checkIncidentDayThreshold(supabase, incidentId, days);
        if (!dayCheckResult.meetsThreshold) {
          console.log(`Incident ${incidentId} does not meet ${days} day threshold: ${dayCheckResult.reason}`);
          await updateRemainderStatus(supabase, email.id, false, dayCheckResult.reason);
          skippedCount++;
          continue;
        }

        if(dayCheckResult.meetsThreshold){
          // If we rech here, the incident meets all criteria for reminder
          console.log(`Incident ${incidentId} meets criteria - sending reminder email`);
          
          // Send the actual reminder email
          const emailSent = await sendReminderEmail(supabase, email, incidentId, days);
          
          if (emailSent) {
            await updateRemainderStatus(supabase, email.id, true, `Incident ${incidentId} reminder email sent successfully for ${days}-day threshold`);
            processedCount++;
          } else {
            await updateRemainderStatus(supabase, email.id, false, `Failed to send reminder email for incident ${incidentId}`);
            failedCount++;
          }

        }


      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);
        await updateRemainderStatus(supabase, email.id, false, `Processing error: ${emailError.message}`);
        failedCount++;
      }
    }

    console.log("Incident Reminder Cron Job: Completed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed incident reminders - ${processedCount} processed, ${failedCount} failed, ${skippedCount} skipped`,
        processedCount,
        failedCount,
        skippedCount
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
 * Validate incident notification before processing - same logic as process-email-queue
 */
async function validateIncidentNotification(supabase: any, email: any): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // Extract Incident_ID from params
    const incidentId = email.params?.Incident_ID;
    if (!incidentId) {
      return { isValid: false, reason: 'Missing Incident_ID in params' };
    }

    // Extract created_by and assigned_to from params
    const originalCreatedBy = email.params?.created_by;
    const originalAssignedTo = email.params?.assigned_to;
    
    if (!originalCreatedBy || !originalAssignedTo) {
      return { isValid: false, reason: 'Missing created_by or assigned_to in params' };
    }

    // Check current incident data from incidents table
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('created_by, assigned_to')
      .eq('ticket_id',incidentId)
      .single();

    if (incidentError || !incident) {
      return { isValid: false, reason: `Incident not found with ticket_id: ${incidentId}` };
    }

    // Compare current vs original values
    if (incident.created_by !== originalCreatedBy) {
      return { 
        isValid: false, 
        reason: `Incident created_by changed from ${originalCreatedBy} to ${incident.created_by}` 
      };
    }

    if (incident.assigned_to !== originalAssignedTo) {
      return { 
        isValid: false, 
        reason: `Incident assigned_to changed from ${originalAssignedTo} to ${incident.assigned_to}` 
      };
    }

    return { isValid: true };

  } catch (error) {
    console.error('Error validating incident notification:', error);
    return { isValid: false, reason: `Validation error: ${error.message}` };
  }
}

/**
 * Check if incident meets the day threshold for reminder
 */
async function checkIncidentDayThreshold(supabase: any, incidentId: string, days: number): Promise<{ meetsThreshold: boolean; reason?: string }> {
  try {
    console.log(`Checking incident day threshold for ticket_id: "${incidentId}" (type: ${typeof incidentId}, length: ${incidentId?.length})`);
    
    // Fetch incident by exact ticket_id, pulling status_id (not a non-existent status column)
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('created_at, status_id, ticket_id')
      .eq('ticket_id', incidentId)
      .single();

    if (incidentError || !incident) {
      console.log(`Database error for ticket_id "${incidentId}":`, incidentError, incident);
      return { meetsThreshold: false, reason: `Incident not found with ticket_id: ${incidentId}` };
    }

    // Resolve status name from incident_status table
    let statusName = '';
    if (incident.status_id) {
      const { data: statusRow, error: statusError } = await supabase
        .from('incident_status')
        .select('name')
        .eq('id', incident.status_id)
        .single();
      if (statusError) {
        console.log(`Failed to resolve status for status_id ${incident.status_id}:`, statusError);
      }
      statusName = statusRow?.name || '';
    }

    // Treat as closed if status name equals Closed (case-insensitive)
    if (statusName && statusName.toLowerCase() === 'closed') {
      return { meetsThreshold: false, reason: `Incident ${incidentId} is already closed` };
    }

    // Calculate days since creation
    const createdDate = new Date(incident.created_at);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Incident ${incidentId} created ${daysDifference} days ago (threshold: ${days} days)`);

    if (daysDifference < days) {
      return { 
        meetsThreshold: false, 
        reason: `Incident ${incidentId} is only ${daysDifference} days old, less than ${days} day threshold` 
      };
    }

    return { 
      meetsThreshold: true, 
      reason: `Incident ${incidentId} is ${daysDifference} days old, meets ${days} day threshold` 
    };

  } catch (error) {
    console.error('Error checking incident day threshold:', error);
    return { meetsThreshold: false, reason: `Day threshold check error: ${error.message}` };
  }
}

/**
 * Send reminder email using the original email template but with reminder context
 */
async function sendReminderEmail(supabase: any, originalEmail: any, incidentId: string, days: number): Promise<boolean> {
  try {
    console.log(`Sending reminder email for incident ${incidentId} to ${originalEmail.recipient_email}`);

    // Get incident details for updated variables
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('*')
      .eq('ticket_id', incidentId)
      .single();

    if (incidentError || !incident) {
      console.error(`Failed to fetch incident details for ${incidentId}:`, incidentError);
      return false;
    }

    // Prepare reminder-specific variables (merge with original email params)
    const reminderVariables = {
      ...originalEmail.params, // Keep original email variables
      Days_Overdue: days,
      Reminder_Message: `This incident has been open for ${days} days and requires your attention.`,
      Original_Date: new Date(incident.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      })
    };

    // Update subject and body to include reminder context
    const reminderSubject = `REMINDER: ${originalEmail.subject} - ${days} Days Overdue`;
    const reminderBody = `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
        <h3 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ Incident Reminder - ${days} Days Overdue</h3>
        <p style="color: #991b1b; margin: 0;">This incident has been open since ${reminderVariables.Original_Date} and requires immediate attention.</p>
      </div>
      
      ${originalEmail.body}
      
      <div style="background-color: #f3f4f6; padding: 16px; margin-top: 16px; border-radius: 8px;">
        <p style="color: #374151; font-size: 14px; margin: 0;">
          <strong>Please take action on this incident as soon as possible.</strong><br>
          If you need assistance or want to reassign this incident, please contact your supervisor.
        </p>
      </div>
    `;

    // Send the reminder email
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
      body: {
        to: originalEmail.recipient_email,
        toName: originalEmail.recipient_name,
        subject: reminderSubject,
        body: reminderBody,
        priority: 'high' // Mark reminders as high priority
      }
    });

    if (emailError || !emailResult?.success) {
      console.error('Failed to send reminder email:', emailError || emailResult);
      return false;
    }

    const messagePreview = (reminderBody || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);

    const { error: centralizedError } = await supabase.rpc('create_centralized_notification', {
      p_client_id: originalEmail.client_id,
      p_module_id: null,
      p_module_name: originalEmail.module_name || 'incident',
      p_email_id: originalEmail.id,
      p_is_reminder_notification: true,
      p_notification_type: 'incident_reminder_10_days',
      p_channel: 'email',
      p_title: reminderSubject,
      p_message: messagePreview || null,
      p_payload: reminderVariables,
      p_recipient_employee_id: null,
      p_recipient_email: originalEmail.recipient_email,
    });

    if (centralizedError) {
      console.error('Failed to create centralized notification for incident reminder:', centralizedError);
    }

    console.log(`Successfully sent reminder email for incident ${incidentId}`);
    return true;

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

/**
 * Update remainder status in both email_queue and notification_logs
 */
async function updateRemainderStatus(supabase: any, emailId: string, success: boolean, logMessage: string): Promise<void> {
  try {
    const currentTime = new Date().toISOString();

    // Update email_queue - set is_remainder_cron_started to true
    const { error: emailError } = await supabase
      .from('email_queue')
      .update({
        is_remainder_cron_started: true,
        updated_at: currentTime
      })
      .eq('id', emailId);

    if (emailError) {
      console.error('Error updating email_queue remainder status:', emailError);
    } else {
      console.log(`Updated email_queue ${emailId} - is_remainder_cron_started: true`);
    }

    // Update corresponding notification_logs
    const { error: logError } = await supabase
      .from('notification_logs')
      .update({
        remainder_cron_status: success,
        remainder_cron_logs: logMessage,
        updated_at: currentTime
      })
      .eq('email_queue_id', emailId);

    if (logError) {
      console.error('Error updating notification_logs remainder status:', logError);
      
      // Try alternative update if email_queue_id relationship doesn't exist
      const { data: emailData, error: emailFetchError } = await supabase
        .from('email_queue')
        .select('module_name, notification_type, recipient_email')
        .eq('id', emailId)
        .single();

      if (!emailFetchError && emailData) {
        const { error: alternativeUpdateError } = await supabase
          .from('notification_logs')
          .update({
            remainder_cron_status: success,
            remainder_cron_logs: logMessage,
            updated_at: currentTime
          })
          .eq('module', emailData.module_name)
          .eq('type', emailData.notification_type)
          .eq('recipient_email', emailData.recipient_email)
          .is('email_queue_id', null);

        if (alternativeUpdateError) {
          console.error('Error with alternative notification_logs update:', alternativeUpdateError);
        } else {
          console.log(`Updated notification_logs via alternative method for email ${emailId}`);
        }
      }
    } else {
      console.log(`Updated notification_logs ${emailId} - remainder_cron_status: ${success}`);
    }

  } catch (error) {
    console.error('Error updating remainder status:', error);
  }
}