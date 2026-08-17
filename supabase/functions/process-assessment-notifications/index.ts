import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

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

    console.log('Starting assessment notification processing...');

    // Process assessment notifications from email queue
    const result = await processAssessmentNotifications(supabase);

    console.log('Assessment notification processing completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assessment notifications processed successfully',
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing assessment notifications:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process assessment notifications',
        error: String(error?.message || error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Process assessment notifications from email queue
 */
async function processAssessmentNotifications(supabase: any) {
  try {
    // Fetch pending assessment notifications from email queue (active only)
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('is_sent', false)
      .eq('module_name', 'assessment')
      .eq('active', true)
      .eq('is_processing', false)
      .lt('retry_count', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch assessment notifications: ${fetchError.message}`);
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      console.log('No assessment notifications to process');
      return { processed: 0, sent: 0, failed: 0 };
    }

    console.log(`Processing ${queuedEmails.length} assessment notifications...`);

    let processed = 0;
    let sent = 0;
    let failed = 0;

    // Process each assessment notification
    for (const email of queuedEmails) {
      processed++;
      
      try {
        const claimed = await claimEmailForProcessing(supabase, email.id, 'process-assessment-notifications');
        if (!claimed) {
          continue;
        }

        // Validate assessment like incident validation
        const validation = await validateAssessmentNotification(supabase, email);
        if (!validation.isValid) {
          // Mark queue inactive and update notification_log
          await supabase
            .from('email_queue')
            .update({
              active: false,
              error_message: validation.reason,
              is_processing: false,
              processing_started_at: null,
              processing_by: null,
            })
            .eq('id', email.id);

          await supabase
            .from('notification_logs')
            .update({ status: 'failed', error_message: validation.reason })
            .eq('email_queue_id', email.id);

          failed++;
          continue;
        }

        // Call the send-notification-email function
        const { data, error } = await supabase.functions.invoke('send-notification-email', {
          body: {
            to: email.recipient_email,
            toName: email.recipient_name,
            subject: email.subject,
            body: email.body,
            priority: email.priority > 0 ? 'high' : 'normal'
          },
          headers: {
            Authorization: `Bearer ${getSupabaseServiceRoleKey()}`
          }
        });

        if (error || !data?.success) {
          console.error(`Failed to send assessment notification ${email.id}:`, error || data);
          await updateEmailStatus(supabase, email.id, false, extractSendErrorMessage(error, data));
          failed++;
        } else {
          console.log(`Assessment notification sent successfully: ${email.id}`);
          await updateEmailStatus(supabase, email.id, true);
          sent++;
        }
      } catch (error: any) {
        console.error(`Error processing assessment notification ${email.id}:`, error);
        await updateEmailStatus(supabase, email.id, false, extractSendErrorMessage(error));
        failed++;
      }
    }

    return { processed, sent, failed };
  } catch (error: any) {
    console.error('Error in processAssessmentNotifications:', error);
    throw error;
  }
}

/**
 * Validate assessment notification against current assessment state
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

    // Fetch current assessment state
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
 * Update email status in queue
 */
async function updateEmailStatus(supabase: any, emailId: string, isSent: boolean, errorMessage?: string): Promise<void> {
  try {
    const currentTime = new Date().toISOString();
    
    if (isSent) {
      // Mark email as sent in email_queue
      const { error: emailError } = await supabase
        .from('email_queue')
        .update({
          is_sent: true,
          sent_at: currentTime,
          error_message: null,
          is_processing: false,
          processing_started_at: null,
          processing_by: null
        })
        .eq('id', emailId);

      if (emailError) {
        console.error('Error updating email status to sent:', emailError);
      }

      // Update corresponding notification_logs status
      const { error: logError } = await supabase
        .from('notification_logs')
        .update({
          status: 'sent',
          sent_at: currentTime,
          error_message: null
        })
        .eq('email_queue_id', emailId);

      if (logError) {
        console.error('Error updating notification log status to sent:', logError);
      }

      await recordCentralizedNotificationForEmail(supabase, emailId);

    } else {
      // Get current retry count and increment
      const { data: emailData, error: fetchError } = await supabase
        .from('email_queue')
        .select('retry_count, max_retries')
        .eq('id', emailId)
        .single();

      if (fetchError) {
        console.error('Error fetching current retry count:', fetchError);
        return;
      }

      const currentRetryCount = emailData?.retry_count || 0;
      const maxRetries = emailData?.max_retries || 3;
      const nextRetryCount = Math.min(currentRetryCount + 1, maxRetries);
      const isExhausted = nextRetryCount >= maxRetries;

      // Update email_queue with failure info
      const { error: emailError } = await supabase
        .from('email_queue')
        .update({
          is_sent: false,
          retry_count: nextRetryCount,
          active: isExhausted ? false : true,
          error_message: errorMessage,
          sent_at: null,
          is_processing: false,
          processing_started_at: null,
          processing_by: null
        })
        .eq('id', emailId);

      if (emailError) {
        console.error('Error updating email status to failed:', emailError);
      }

      // Update corresponding notification_logs status
      const { error: logError } = await supabase
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('email_queue_id', emailId);

      if (logError) {
        console.error('Error updating notification log status to failed:', logError);
      }
    }
  } catch (error) {
    console.error('Error updating email status:', error);
  }
} 

async function recordCentralizedNotificationForEmail(supabase: any, emailId: string): Promise<void> {
  try {
    const { data: emailRow, error: emailFetchError } = await supabase
      .from('email_queue')
      .select('id, client_id, module_name, notification_type, recipient_email, subject, body, params')
      .eq('id', emailId)
      .single();

    if (emailFetchError || !emailRow) {
      console.error('Failed to fetch email queue row for centralized notification:', emailFetchError);
      return;
    }

    const messagePreview = (emailRow.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);

    const { error: rpcError } = await supabase.rpc('create_centralized_notification', {
      p_client_id: emailRow.client_id,
      p_module_id: null,
      p_module_name: emailRow.module_name || null,
      p_email_id: emailRow.id,
      p_notification_type: emailRow.notification_type || 'email_notification',
      p_channel: 'email',
      p_title: emailRow.subject || null,
      p_message: messagePreview || null,
      p_payload: emailRow.params || {},
      p_recipient_employee_id: null,
      p_recipient_email: emailRow.recipient_email || null,
    });

    if (rpcError) {
      console.error('Failed to create centralized notification from assessment processor:', rpcError);
    }
  } catch (error) {
    console.error('Error creating centralized notification from assessment processor:', error);
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
      .eq('is_sent', false)
      .eq('active', true)
      .eq('is_processing', false)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error(`Failed to claim assessment email ${emailId}:`, error);
      return false;
    }

    return Boolean(data?.id);
  } catch (error) {
    console.error(`Error claiming assessment email ${emailId}:`, error);
    return false;
  }
}