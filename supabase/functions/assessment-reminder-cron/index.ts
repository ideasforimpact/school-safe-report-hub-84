import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AssessmentReminderResult {
  dueReminders: number;
  overdueReminders: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting assessment reminder cron job...');
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    const result = await processAssessmentReminders(supabase);

    console.log('Assessment reminder cron completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assessment reminders processed successfully',
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in assessment reminder cron:', error);
    
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
 * Process assessment reminders (due in 5 days and overdue)
 */
async function processAssessmentReminders(supabase: any): Promise<AssessmentReminderResult> {
  const result: AssessmentReminderResult = {
    dueReminders: 0,
    overdueReminders: 0,
    errors: []
  };

  try {
    const today = new Date();
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    // Format dates for comparison (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split('T')[0];

    console.log('Processing reminders for date:', todayStr);
    console.log('Looking for assessments due on:', fiveDaysFromNowStr);

    // 1. Find assessments due in exactly 5 days (not already notified today)
    const { data: dueAssessments, error: dueError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        target_completion_date,
        assigned_to,
        created_by,
        client_id,
        assigned_employee:employees!assessments_assigned_to_fkey(id, first_name, last_name, email, status)
      `)
      .eq('status', 'assigned')
      .eq('target_completion_date', fiveDaysFromNowStr)
      .eq('employees.status', true); // Only active employees

    if (dueError) {
      console.error('Error fetching due assessments:', dueError);
      result.errors.push(`Error fetching due assessments: ${dueError.message}`);
    } else {
      console.log(`Found ${dueAssessments?.length || 0} assessments due in 5 days`);
      
      for (const assessment of dueAssessments || []) {
        if (assessment.assigned_employee) {
          try {
            // Check if we already sent a reminder today for this assessment
            const { data: existingReminder } = await supabase
              .from('notification_logs')
              .select('id')
              .eq('module', 'assessment')
              .eq('type', 'assessment_due_5_days')
              .eq('recipient_id', assessment.assigned_to)
              .eq('status', 'sent')
              .gte('created_at', `${todayStr}T00:00:00Z`)
              .lt('created_at', `${todayStr}T23:59:59Z`)
              .limit(1);

            if (existingReminder && existingReminder.length > 0) {
              console.log(`Due reminder already sent today for assessment ${assessment.id}`);
              continue;
            }

            await queueAssessmentDueReminderNotification(supabase, assessment, assessment.assigned_employee);
            result.dueReminders++;
            console.log(`Queued due reminder for assessment ${assessment.id}`);
          } catch (error: any) {
            const errorMsg = `Error processing due reminder for assessment ${assessment.id}: ${error.message}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        }
      }
    }

    // 2. Find overdue assessments (not already notified today)
    const { data: overdueAssessments, error: overdueError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        target_completion_date,
        assigned_to,
        created_by,
        client_id,
        assigned_employee:employees!assessments_assigned_to_fkey(id, first_name, last_name, email, status)
      `)
      .eq('status', 'assigned')
      .lt('target_completion_date', todayStr)
      .eq('employees.status', true); // Only active employees

    if (overdueError) {
      console.error('Error fetching overdue assessments:', overdueError);
      result.errors.push(`Error fetching overdue assessments: ${overdueError.message}`);
    } else {
      console.log(`Found ${overdueAssessments?.length || 0} overdue assessments`);
      
      for (const assessment of overdueAssessments || []) {
        if (assessment.assigned_employee && assessment.target_completion_date) {
          try {
            // Check if we already sent an overdue reminder today for this assessment
            const { data: existingReminder } = await supabase
              .from('notification_logs')
              .select('id')
              .eq('module', 'assessment')
              .eq('type', 'assessment_overdue')
              .eq('recipient_id', assessment.assigned_to)
              .eq('status', 'sent')
              .gte('created_at', `${todayStr}T00:00:00Z`)
              .lt('created_at', `${todayStr}T23:59:59Z`)
              .limit(1);

            if (existingReminder && existingReminder.length > 0) {
              console.log(`Overdue reminder already sent today for assessment ${assessment.id}`);
              continue;
            }

            const dueDate = new Date(assessment.target_completion_date);
            const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
            
            await queueAssessmentOverdueNotification(supabase, assessment, assessment.assigned_employee, overdueDays);
            result.overdueReminders++;
            console.log(`Queued overdue reminder for assessment ${assessment.id} (${overdueDays} days overdue)`);
          } catch (error: any) {
            const errorMsg = `Error processing overdue reminder for assessment ${assessment.id}: ${error.message}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        }
      }
    }

  } catch (error: any) {
    console.error('Error in processAssessmentReminders:', error);
    result.errors.push(`General processing error: ${error.message}`);
  }

  return result;
}

/**
 * Queue assessment due in 5 days notification
 */
async function queueAssessmentDueReminderNotification(
  supabase: any, 
  assessment: any, 
  assignedEmployee: any
): Promise<void> {
  const getBaseUrl = () => {
    return Deno.env.get('NODE_ENV') === 'production' 
      ? 'https://school-safe-report-hub.vercel.app'
      : 'http://localhost:3000';
  };

  const variables = {
    User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
    Assessment_ID: assessment.id,
    Assessment_Title: assessment.title,
    Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Not specified',
    Assessment_URL: `${getBaseUrl()}/assessments/${assessment.id}`
  };

  // Queue email directly in email_queue table
  const { error } = await supabase
    .from('email_queue')
    .insert({
      module_name: 'assessment',
      notification_type: 'assessment_due_5_days',
      client_id: assessment.client_id,
      recipient_email: assignedEmployee.email,
      recipient_name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
      subject: 'Reminder – 5 Days Left for Assessment Due Date [Assessment ID: {{Assessment_ID}}]'
        .replace('{{Assessment_ID}}', assessment.id),
      body: generateAssessmentDueReminderEmailBody(variables),
      params: {
        ...variables,
        template_id: 'frontend-assessment-due-5-days',
        module: 'assessment',
        type: 'assessment_due_5_days',
        priority: 'medium'
      },
      priority: 0,
      is_sent: false,
      retry_count: 0,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to queue due reminder email: ${error.message}`);
  }

  // Log notification
  await supabase
    .from('notification_logs')
    .insert({
      module: 'assessment',
      type: 'assessment_due_5_days',
      recipient_id: assignedEmployee.id,
      recipient_email: assignedEmployee.email,
      subject: 'Reminder – 5 Days Left for Assessment Due Date [Assessment ID: {{Assessment_ID}}]'
        .replace('{{Assessment_ID}}', assessment.id),
      body: generateAssessmentDueReminderEmailBody(variables),
      status: 'pending',
      metadata: {
        assessmentId: assessment.id,
        createdBy: assessment.created_by,
        assignedTo: assessment.assigned_to,
        actionBy: assessment.assigned_to // System reminder
      }
    });
}

/**
 * Queue assessment overdue notification
 */
async function queueAssessmentOverdueNotification(
  supabase: any, 
  assessment: any, 
  assignedEmployee: any, 
  overdueDays: number
): Promise<void> {
  const getBaseUrl = () => {
    return Deno.env.get('NODE_ENV') === 'production' 
      ? 'https://school-safe-report-hub.vercel.app'
      : 'http://localhost:3000';
  };

  const variables = {
    User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
    Assessment_ID: assessment.id,
    Assessment_Title: assessment.title,
    Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Not specified',
    Overdue_Days: overdueDays.toString(),
    Assessment_URL: `${getBaseUrl()}/assessments/${assessment.id}`
  };

  // Queue email directly in email_queue table
  const { error } = await supabase
    .from('email_queue')
    .insert({
      module_name: 'assessment',
      notification_type: 'assessment_overdue',
      client_id: assessment.client_id,
      recipient_email: assignedEmployee.email,
      recipient_name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
      subject: 'Assessment Overdue by {{Overdue_Days}} Days – [Assessment ID: {{Assessment_ID}}]'
        .replace('{{Assessment_ID}}', assessment.id)
        .replace('{{Overdue_Days}}', overdueDays.toString()),
      body: generateAssessmentOverdueEmailBody(variables),
      params: {
        ...variables,
        template_id: 'frontend-assessment-overdue',
        module: 'assessment',
        type: 'assessment_overdue',
        priority: 'high'
      },
      priority: 1, // High priority for overdue
      is_sent: false,
      retry_count: 0,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to queue overdue email: ${error.message}`);
  }

  // Log notification
  await supabase
    .from('notification_logs')
    .insert({
      module: 'assessment',
      type: 'assessment_overdue',
      recipient_id: assignedEmployee.id,
      recipient_email: assignedEmployee.email,
      subject: 'Assessment Overdue by {{Overdue_Days}} Days – [Assessment ID: {{Assessment_ID}}]'
        .replace('{{Assessment_ID}}', assessment.id)
        .replace('{{Overdue_Days}}', overdueDays.toString()),
      body: generateAssessmentOverdueEmailBody(variables),
      status: 'pending',
      metadata: {
        assessmentId: assessment.id,
        createdBy: assessment.created_by,
        assignedTo: assessment.assigned_to,
        actionBy: assessment.assigned_to, // System reminder
        overdueDays: overdueDays
      }
    });
}

/**
 * Generate email body for due reminder (simplified HTML)
 */
function generateAssessmentDueReminderEmailBody(variables: any): string {
  return `
<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#fef3c7;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">⏰ Assessment Due Reminder</h2>
</div>
<div style="text-align:left;">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>${variables.User_Name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">This is a reminder that your assessment is due in <strong>5 days</strong>.</p>
<div style="background-color:#fef3c7;padding:16px;border-radius:6px;border-left:4px solid #f59e0b;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Assessment Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> ${variables.Assessment_ID}</p>
<p style="margin:6px 0;"><strong>Title:</strong> ${variables.Assessment_Title}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> ${variables.Due_Date}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Kindly complete and submit it on time. <a href="${variables.Assessment_URL}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
}

/**
 * Generate email body for overdue notification (simplified HTML)
 */
function generateAssessmentOverdueEmailBody(variables: any): string {
  return `
<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#fee2e2;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🚨 Assessment Overdue</h2>
</div>
<div style="text-align:left;">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>${variables.User_Name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment is overdue by <strong>${variables.Overdue_Days} days</strong> and requires immediate attention.</p>
<div style="background-color:#fee2e2;padding:16px;border-radius:6px;border-left:4px solid #dc2626;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Overdue Assessment:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> ${variables.Assessment_ID}</p>
<p style="margin:6px 0;"><strong>Title:</strong> ${variables.Assessment_Title}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> ${variables.Due_Date}</p>
<p style="margin:6px 0;"><strong>Days Overdue:</strong> ${variables.Overdue_Days}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please submit it at the earliest to avoid escalation. <a href="${variables.Assessment_URL}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
} 