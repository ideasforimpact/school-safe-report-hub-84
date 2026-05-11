import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey, getFrontendUrl } from '../_shared/env.ts';

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
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
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
    console.log('Scanning active assessment queue for 5-day reminders...');
    const { data: queue, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('module_name', 'assessment')
      .eq('active', true)
      .eq('is_sent', true)
      .eq('is_processing', false)
      .eq('is_due_reminder_sent', false);

    if (error) {
      console.error('Error fetching active assessment queue (5-day):', error);
      result.errors++;
      return;
    }

    console.log(queue,"queue (5-day):");
    

    for (const email of queue || []) {
      try {
        const claimed = await claimEmailForProcessing(supabase, email.id, 'assessment-reminders-cron-due');
        if (!claimed) {
          continue;
        }

        const validation = await validateAssessmentNotification(supabase, email);
        if (!validation.isValid) {
          await supabase.from('email_queue').update({
            active: false,
            error_message: validation.reason,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: validation.reason }).eq('email_queue_id', email.id);
          result.errors++;
          continue;
        }

        // Ensure it is actually 5 days before due date
        const params = email.params || {};
        const assessmentId = params.Assessment_ID || params.assessmentId || params.assessment_id;
        const { data: assessment } = await supabase
          .from('assessments')
          .select('name, target_completion_date, assigned_to, created_by, client_id')
          .eq('id', assessmentId)
          .single();

        console.log(assessment,"assessment 5-day",assessmentId);
        if (!assessment?.target_completion_date) {
          await releaseEmailClaim(supabase, email.id);
          continue;
        }
        const today = new Date(); today.setHours(0,0,0,0);
        const dueDate = new Date(assessment.target_completion_date); dueDate.setHours(0,0,0,0);
        const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / (24*60*60*1000));
        if (daysDiff !== 5) {
          await releaseEmailClaim(supabase, email.id);
          continue;
        }

        // Build 5th-day reminder email (inline template like incident cron)
        const variables = {
          User_Name: email.recipient_name,
          Assessment_ID: assessmentId,
          Assessment_Title: assessment.name,
          Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          Assessment_URL: `${getBaseUrl()}/assessments`
        };

        const subject = `Reminder – 5 Days Left for Assessment Due Date [Assessment ID: ${variables.Assessment_ID}]`;
        const body = generateAssessmentDueReminderEmailBody(variables);
        const { data: sendRes, error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: { to: email.recipient_email, toName: email.recipient_name, subject, body, priority: email.priority > 0 ? 'high' : 'normal' },
          headers: { Authorization: `Bearer ${getSupabaseServiceRoleKey()}` }
        });
        if (!sendErr && sendRes?.success) {
          const nowIso = new Date().toISOString();
          await supabase.from('email_queue').update({
            is_sent: true,
            is_due_reminder_sent: true,
            sent_at: nowIso,
            error_message: null,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'sent', sent_at: nowIso, error_message: null }).eq('email_queue_id', email.id);
          await createCentralizedReminderNotification(supabase, email, subject, body, 'assessment_due_5_days');
          result.dueReminders++;
        } else {
          const errorMessage = extractSendErrorMessage(sendErr, sendRes);
          const nextRetryCount = Math.min((email.retry_count || 0) + 1, email.max_retries || 3);
          const isExhausted = nextRetryCount >= (email.max_retries || 3);
          await supabase.from('email_queue').update({
            retry_count: nextRetryCount,
            active: isExhausted ? false : true,
            error_message: errorMessage,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: errorMessage }).eq('email_queue_id', email.id);
          result.errors++;
        }
      } catch (e) {
        console.error('Error validating 5-day queue email:', e);
        await releaseEmailClaim(supabase, email.id);
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
    console.log('Scanning active assessment queue for overdue reminders...');
    const { data: queue, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('module_name', 'assessment')
      .eq('notification_type', 'assessment_assigned')
      .eq('active', true)
      .eq('is_sent', true)
      .eq('is_processing', false)
      .eq('is_remainder_cron_started', false);

    if (error) {
      console.error('Error fetching active assessment queue (overdue):', error);
      result.errors++;
      return;
    }

    console.log(queue,"Over due reminder");
    

    for (const email of queue || []) {
      try {
        const claimed = await claimEmailForProcessing(supabase, email.id, 'assessment-reminders-cron-overdue');
        if (!claimed) {
          continue;
        }

        const validation = await validateAssessmentNotification(supabase, email);
        if (!validation.isValid) {
          await supabase.from('email_queue').update({
            active: false,
            error_message: validation.reason,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: validation.reason }).eq('email_queue_id', email.id);
          result.errors++;
          continue;
        }

        // Ensure it is actually overdue
        const params = email.params || {};
        const assessmentId = params.Assessment_ID || params.assessmentId || params.assessment_id;
        const { data: assessment } = await supabase
          .from('assessments')
          .select('name, target_completion_date, assigned_to, created_by, client_id')
          .eq('id', assessmentId)
          .single();

        console.log(assessment,"assessment",assessmentId);
        
        if (!assessment?.target_completion_date) {
          await releaseEmailClaim(supabase, email.id);
          continue;
        }
        const today = new Date(); today.setHours(0,0,0,0);
        const dueDate = new Date(assessment.target_completion_date); dueDate.setHours(0,0,0,0);
        if (!(dueDate.getTime() < today.getTime())) {
          await releaseEmailClaim(supabase, email.id);
          continue;
        }

        // Build overdue reminder email (inline template like incident cron)
        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24*60*60*1000));
        const variables = {
          User_Name: email.recipient_name,
          Assessment_ID: assessmentId,
          Assessment_Title: assessment.name,
          Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          Overdue_Days: overdueDays.toString(),
          Assessment_URL: `${getBaseUrl()}/assessments`
        };

        const subject = `Assessment Overdue by ${variables.Overdue_Days} Days – [Assessment ID: ${variables.Assessment_ID}]`;
        const body = generateAssessmentOverdueEmailBody(variables);
        const { data: sendRes, error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: { to: email.recipient_email, toName: email.recipient_name, subject, body, priority: 'high' },
          headers: { Authorization: `Bearer ${getSupabaseServiceRoleKey()}` }
        });
        if (!sendErr && sendRes?.success) {
          const nowIso = new Date().toISOString();
          await supabase.from('email_queue').update({
            is_sent: true,
            is_remainder_cron_started: true,
            sent_at: nowIso,
            error_message: null,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'sent', sent_at: nowIso, error_message: null }).eq('email_queue_id', email.id);
          await createCentralizedReminderNotification(supabase, email, subject, body, 'assessment_overdue');
          result.overdueReminders++;
        } else {
          const errorMessage = extractSendErrorMessage(sendErr, sendRes);
          const nextRetryCount = Math.min((email.retry_count || 0) + 1, email.max_retries || 3);
          const isExhausted = nextRetryCount >= (email.max_retries || 3);
          await supabase.from('email_queue').update({
            retry_count: nextRetryCount,
            active: isExhausted ? false : true,
            error_message: errorMessage,
            is_processing: false,
            processing_started_at: null,
            processing_by: null
          }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: errorMessage }).eq('email_queue_id', email.id);
          result.errors++;
        }
      } catch (e) {
        console.error('Error validating overdue queue email:', e);
        await releaseEmailClaim(supabase, email.id);
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
 * Validate assessment notification helper (shared with processor)
 */
async function validateAssessmentNotification(supabase: any, email: any): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const params = email.params || {};
    const assessmentId = params.Assessment_ID || params.assessmentId || params.assessment_id;
    const paramCreatedBy = params.created_by;
    const paramAssignedTo = params.assigned_to;

    if (!assessmentId) {
      return { isValid: false, reason: 'Missing Assessment_ID in params' };
    }

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('created_by, assigned_to')
      .eq('id', assessmentId)
      .single();

    if (error || !assessment) {
      return { isValid: false, reason: `Assessment not found with id: ${assessmentId}` };
    }

    if (assessment.created_by !== paramCreatedBy) {
      return { isValid: false, reason: 'Creator changed since email was queued' };
    }

    if (assessment.assigned_to !== paramAssignedTo) {
      return { isValid: false, reason: 'Assignee changed since email was queued' };
    }

    return { isValid: true };
  } catch (e: any) {
    return { isValid: false, reason: `Validation error: ${e.message}` };
  }
}

/**
 * Get base URL - uses shared function for consistency
 */
function getBaseUrl(): string {
  return getFrontendUrl();
} 

async function claimEmailForProcessing(supabase: any, emailId: string, processorName: string): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('email_queue')
      .update({
        is_processing: true,
        processing_started_at: nowIso,
        processing_by: processorName,
      })
      .eq('id', emailId)
      .eq('active', true)
      .eq('is_sent', true)
      .eq('is_processing', false)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error(`Failed to claim assessment reminder email ${emailId}:`, error);
      return false;
    }

    return Boolean(data?.id);
  } catch (error) {
    console.error(`Error claiming assessment reminder email ${emailId}:`, error);
    return false;
  }
}

async function releaseEmailClaim(supabase: any, emailId: string): Promise<void> {
  try {
    await supabase
      .from('email_queue')
      .update({
        is_processing: false,
        processing_started_at: null,
        processing_by: null,
      })
      .eq('id', emailId);
  } catch (error) {
    console.error(`Error releasing assessment reminder email claim ${emailId}:`, error);
  }
}

async function createCentralizedReminderNotification(
  supabase: any,
  email: any,
  subject: string,
  body: string,
  type: string
): Promise<void> {
  try {
    const messagePreview = (body || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);

    const { error } = await supabase.rpc('create_centralized_notification', {
      p_client_id: email.client_id,
      p_module_id: null,
      p_module_name: email.module_name || 'assessment',
      p_email_id: email.id,
      p_is_reminder_notification: true,
      p_notification_type: type,
      p_channel: 'email',
      p_title: subject || email.subject || null,
      p_message: messagePreview || null,
      p_payload: email.params || {},
      p_recipient_employee_id: null,
      p_recipient_email: email.recipient_email || null,
    });

    if (error) {
      console.error('Failed to create centralized assessment reminder notification:', error);
    }
  } catch (error) {
    console.error('Error creating centralized assessment reminder notification:', error);
  }
}

function extractSendErrorMessage(error?: any, data?: any): string {
  const parts: string[] = [];
  if (error?.message) parts.push(error.message);
  if (data?.error) parts.push(String(data.error));
  if (data?.message) parts.push(String(data.message));
  if (data?.errorType) parts.push(`type=${data.errorType}`);
  if (data?.status) parts.push(`status=${data.status}`);
  const composed = parts.filter(Boolean).join(' | ');
  return composed || 'Email send failed';
}

function generateAssessmentDueReminderEmailBody(variables: any): string {
  return `
<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
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
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Kindly complete and submit it on time. <a href="${variables.Assessment_URL}?assessmentId=${encodeURIComponent(String(variables.Assessment_ID))}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
}

function generateAssessmentOverdueEmailBody(variables: any): string {
  return `
<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
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
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please submit it at the earliest to avoid escalation. <a href="${variables.Assessment_URL}?assessmentId=${encodeURIComponent(String(variables.Assessment_ID))}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
}