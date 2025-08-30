import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting assessment reminders cron job...');

    const result = await processAssessmentReminders(supabase);

    console.log('Assessment reminders cron job completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assessment reminders processed successfully',
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in assessment reminders cron:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process assessment reminders',
        error: String(error?.message || error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Process assessment reminders
 */
async function processAssessmentReminders(supabase: any) {
  const result = {
    dueReminders: 0,
    overdueReminders: 0,
    errors: 0
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Process "Due in 5 Days" reminders
    await processDueIn5DaysReminders(supabase, today, result);

    // 2. Process "Overdue" reminders
    await processOverdueReminders(supabase, today, result);

    return result;
  } catch (error: any) {
    console.error('Error in processAssessmentReminders:', error);
    throw error;
  }
}

/**
 * Process assessments due in 5 days
 */
async function processDueIn5DaysReminders(supabase: any, today: Date, result: any) {
  try {
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const fiveDaysEnd = new Date(fiveDaysFromNow.getTime() + 24 * 60 * 60 * 1000);

    console.log('Checking assessments due in 5 days...');
    console.log('Date range:', fiveDaysFromNow.toISOString(), 'to', fiveDaysEnd.toISOString());

    // Find assessments due in exactly 5 days that are still assigned/in-progress
    const { data: dueAssessments, error: dueError } = await supabase
      .from('assessments')
      .select(`
        id, title, target_completion_date, assigned_to, created_by, client_id,
        assigned_employee:employees!assigned_to(id, first_name, last_name, email, status)
      `)
      .in('status', ['assigned', 'in_progress', 'submitted'])
      .not('target_completion_date', 'is', null)
      .gte('target_completion_date', fiveDaysFromNow.toISOString().split('T')[0])
      .lt('target_completion_date', fiveDaysEnd.toISOString().split('T')[0]);

    if (dueError) {
      console.error('Error fetching due assessments:', dueError);
      result.errors++;
      return;
    }

    console.log(`Found ${dueAssessments?.length || 0} assessments due in 5 days`);

    for (const assessment of dueAssessments || []) {
      if (!assessment.assigned_employee || !assessment.assigned_employee.status) {
        console.log(`Skipping assessment ${assessment.id} - no active assigned employee`);
        continue;
      }

      try {
        // Check if we already sent a reminder today for this assessment
        const alreadySent = await checkIfReminderSentToday(supabase, assessment.id, 'assessment_due_5_days');
        if (alreadySent) {
          console.log(`Reminder already sent today for assessment ${assessment.id}`);
          continue;
        }

        // Queue the due reminder notification
        await queueAssessmentNotification(supabase, {
          assessment,
          employee: assessment.assigned_employee,
          type: 'assessment_due_5_days',
          variables: {
            User_Name: `${assessment.assigned_employee.first_name} ${assessment.assigned_employee.last_name}`,
            Assessment_ID: assessment.id,
            Assessment_Title: assessment.title,
            Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            Assessment_URL: `${getBaseUrl()}/assessments/${assessment.id}`
          }
        });

        result.dueReminders++;
        console.log(`Queued 5-day reminder for assessment ${assessment.id}`);
      } catch (error: any) {
        console.error(`Error processing due reminder for assessment ${assessment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error: any) {
    console.error('Error in processDueIn5DaysReminders:', error);
    result.errors++;
  }
}

/**
 * Process overdue assessments
 */
async function processOverdueReminders(supabase: any, today: Date, result: any) {
  try {
    console.log('Checking overdue assessments...');

    // Find overdue assessments
    const { data: overdueAssessments, error: overdueError } = await supabase
      .from('assessments')
      .select(`
        id, title, target_completion_date, assigned_to, created_by, client_id,
        assigned_employee:employees!assigned_to(id, first_name, last_name, email, status)
      `)
      .in('status', ['assigned', 'in_progress', 'submitted'])
      .not('target_completion_date', 'is', null)
      .lt('target_completion_date', today.toISOString().split('T')[0]);

    if (overdueError) {
      console.error('Error fetching overdue assessments:', overdueError);
      result.errors++;
      return;
    }

    console.log(`Found ${overdueAssessments?.length || 0} overdue assessments`);

    for (const assessment of overdueAssessments || []) {
      if (!assessment.assigned_employee || !assessment.assigned_employee.status) {
        console.log(`Skipping assessment ${assessment.id} - no active assigned employee`);
        continue;
      }

      try {
        // Check if we already sent an overdue reminder today
        const alreadySent = await checkIfReminderSentToday(supabase, assessment.id, 'assessment_overdue');
        if (alreadySent) {
          console.log(`Overdue reminder already sent today for assessment ${assessment.id}`);
          continue;
        }

        // Calculate overdue days
        const dueDate = new Date(assessment.target_completion_date);
        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));

        // Queue the overdue notification
        await queueAssessmentNotification(supabase, {
          assessment,
          employee: assessment.assigned_employee,
          type: 'assessment_overdue',
          variables: {
            User_Name: `${assessment.assigned_employee.first_name} ${assessment.assigned_employee.last_name}`,
            Assessment_ID: assessment.id,
            Assessment_Title: assessment.title,
            Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            Overdue_Days: overdueDays.toString(),
            Assessment_URL: `${getBaseUrl()}/assessments/${assessment.id}`
          }
        });

        result.overdueReminders++;
        console.log(`Queued overdue reminder for assessment ${assessment.id} (${overdueDays} days overdue)`);
      } catch (error: any) {
        console.error(`Error processing overdue reminder for assessment ${assessment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error: any) {
    console.error('Error in processOverdueReminders:', error);
    result.errors++;
  }
}

/**
 * Check if reminder was already sent today
 */
async function checkIfReminderSentToday(supabase: any, assessmentId: string, notificationType: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('module', 'assessment')
      .eq('type', notificationType)
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)
      .contains('metadata', { assessmentId })
      .limit(1);

    if (error) {
      console.error('Error checking reminder logs:', error);
      return false;
    }

    return logs && logs.length > 0;
  } catch (error) {
    console.error('Error in checkIfReminderSentToday:', error);
    return false;
  }
}

/**
 * Queue assessment notification
 */
async function queueAssessmentNotification(supabase: any, data: any) {
  try {
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('subject, body')
      .eq('module', 'assessment')
      .eq('type', data.type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found for ${data.type}`);
    }

    // Process template variables
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(data.variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Queue email
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert({
        module_name: 'assessment',
        notification_type: data.type,
        client_id: data.assessment.client_id,
        recipient_email: data.employee.email,
        recipient_name: `${data.employee.first_name} ${data.employee.last_name}`,
        subject,
        body,
        params: data.variables,
        priority: data.type === 'assessment_overdue' ? 1 : 0,
        is_sent: false,
        retry_count: 0,
        max_retries: 3,
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (queueError) {
      throw new Error(`Failed to queue notification: ${queueError.message}`);
    }

    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        module: 'assessment',
        type: data.type,
        recipient_id: data.employee.id,
        recipient_email: data.employee.email,
        subject,
        body,
        status: 'pending',
        metadata: {
          assessmentId: data.assessment.id,
          createdBy: data.assessment.created_by,
          assignedTo: data.assessment.assigned_to,
          actionBy: data.assessment.assigned_to
        }
      });

  } catch (error: any) {
    console.error('Error queueing assessment notification:', error);
    throw error;
  }
}

/**
 * Get base URL
 */
function getBaseUrl(): string {
  return Deno.env.get('FRONTEND_URL') || 'https://school-safe-report-hub.vercel.app';
} 