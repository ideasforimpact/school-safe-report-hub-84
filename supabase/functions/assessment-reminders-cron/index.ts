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
      .eq('is_sent', false)
      .eq('is_due_reminder_sent', false);

    if (error) {
      console.error('Error fetching active assessment queue (5-day):', error);
      result.errors++;
      return;
    }

    console.log(queue,"queue (5-day):");
    

    for (const email of queue || []) {
      try {
        const validation = await validateAssessmentNotification(supabase, email);
        if (!validation.isValid) {
          await supabase.from('email_queue').update({ active: false, error_message: validation.reason }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: validation.reason }).eq('email_queue_id', email.id);
          result.errors++;
          continue;
        }

        // Ensure it is actually 5 days before due date
        const params = email.params || {};
        const assessmentId = params.Assessment_ID || params.assessmentId || params.assessment_id;
        const { data: assessment } = await supabase
          .from('assessments')
          .select('title, target_completion_date, assigned_to, created_by, client_id')
          .eq('id', assessmentId)
          .single();
        if (!assessment?.target_completion_date) {
          continue;
        }
        const today = new Date(); today.setHours(0,0,0,0);
        const dueDate = new Date(assessment.target_completion_date); dueDate.setHours(0,0,0,0);
        const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / (24*60*60*1000));
        if (daysDiff !== 5) {
          continue;
        }

        // Build 5th-day reminder email (inline template like incident cron)
        const variables = {
          User_Name: email.recipient_name,
          Assessment_ID: assessmentId,
          Assessment_Title: assessment.title,
          Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          Assessment_URL: `${getBaseUrl()}/assessments`
        };

        const subject = `Reminder – 5 Days Left for Assessment Due Date [Assessment ID: ${variables.Assessment_ID}]`;
        const body = `
Hello ${variables.User_Name},

This is a reminder that your assessment is due in 5 days.

Details:

Assessment ID: ${variables.Assessment_ID}

Title: ${variables.Assessment_Title}

Due Date: ${variables.Due_Date}

Kindly complete and submit it on time.

Regards,
Safe School Team
        `.trim();
        const { data: sendRes, error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: { to: email.recipient_email, toName: email.recipient_name, subject, body, priority: email.priority > 0 ? 'high' : 'normal' },
          headers: { Authorization: `Bearer ${getSupabaseServiceRoleKey()}` }
        });
        if (!sendErr && sendRes?.success) {
          const nowIso = new Date().toISOString();
          await supabase.from('email_queue').update({ is_sent: true, is_due_reminder_sent: true, sent_at: nowIso, error_message: null }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'sent', sent_at: nowIso, error_message: null }).eq('email_queue_id', email.id);
          result.dueReminders++;
        } else {
          await supabase.from('email_queue').update({ retry_count: (email.retry_count || 0) + 1, error_message: sendErr?.message || 'Send failed' }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: sendErr?.message || 'Send failed' }).eq('email_queue_id', email.id);
          result.errors++;
        }
      } catch (e) {
        console.error('Error validating 5-day queue email:', e);
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
      .eq('active', true)
      .eq('is_sent', false)
      .eq('is_remainder_cron_started', false);

    if (error) {
      console.error('Error fetching active assessment queue (overdue):', error);
      result.errors++;
      return;
    }

    console.log(queue,"Over due reminder");
    

    for (const email of queue || []) {
      try {
        const validation = await validateAssessmentNotification(supabase, email);
        if (!validation.isValid) {
          await supabase.from('email_queue').update({ active: false, error_message: validation.reason }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: validation.reason }).eq('email_queue_id', email.id);
          result.errors++;
          continue;
        }

        // Ensure it is actually overdue
        const params = email.params || {};
        const assessmentId = params.Assessment_ID || params.assessmentId || params.assessment_id;
        const { data: assessment } = await supabase
          .from('assessments')
          .select('title, target_completion_date, assigned_to, created_by, client_id')
          .eq('id', assessmentId)
          .single();
        if (!assessment?.target_completion_date) {
          continue;
        }
        const today = new Date(); today.setHours(0,0,0,0);
        const dueDate = new Date(assessment.target_completion_date); dueDate.setHours(0,0,0,0);
        if (!(dueDate.getTime() < today.getTime())) {
          continue;
        }

        // Build overdue reminder email (inline template like incident cron)
        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24*60*60*1000));
        const variables = {
          User_Name: email.recipient_name,
          Assessment_ID: assessmentId,
          Assessment_Title: assessment.title,
          Due_Date: new Date(assessment.target_completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          Overdue_Days: overdueDays.toString(),
          Assessment_URL: `${getBaseUrl()}/assessments`
        };

        const subject = `Assessment Overdue by ${variables.Overdue_Days} Days – [Assessment ID: ${variables.Assessment_ID}]`;
        const body = `
Hello ${variables.User_Name},

The following assessment is overdue by ${variables.Overdue_Days} days and requires immediate attention.

Details:

Assessment ID: ${variables.Assessment_ID}

Title: ${variables.Assessment_Title}

Due Date: ${variables.Due_Date}

Please submit it at the earliest to avoid escalation.

Regards,
Safe School Team
        `.trim();
        const { data: sendRes, error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: { to: email.recipient_email, toName: email.recipient_name, subject, body, priority: 'high' },
          headers: { Authorization: `Bearer ${getSupabaseServiceRoleKey()}` }
        });
        if (!sendErr && sendRes?.success) {
          const nowIso = new Date().toISOString();
          await supabase.from('email_queue').update({ is_sent: true, is_remainder_cron_started: true, sent_at: nowIso, error_message: null }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'sent', sent_at: nowIso, error_message: null }).eq('email_queue_id', email.id);
          result.overdueReminders++;
        } else {
          await supabase.from('email_queue').update({ retry_count: (email.retry_count || 0) + 1, error_message: sendErr?.message || 'Send failed' }).eq('id', email.id);
          await supabase.from('notification_logs').update({ status: 'failed', error_message: sendErr?.message || 'Send failed' }).eq('email_queue_id', email.id);
          result.errors++;
        }
      } catch (e) {
        console.error('Error validating overdue queue email:', e);
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