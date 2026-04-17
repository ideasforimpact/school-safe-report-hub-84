import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailQueueItem {
  id: string;
  module_name: string;
  notification_type: string;
  client_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  params: Record<string, any>;
  priority: number;
  retry_count: number;
  max_retries: number;
}

interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

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

    console.log('Starting email queue processing...');

    // Process emails in batches
    const result = await processEmailQueue(supabase);

    console.log('Email queue processing completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queue processed successfully',
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing email queue:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process email queue',
        error: String(error?.message || error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Process queued emails and send them
 */
async function processEmailQueue(supabase: any): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Fetch pending emails (not sent, within retry limit, active, ordered by priority and creation time)
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('is_sent', false)
      .eq('active', true) // Only process active emails
      .eq('is_processing', false) // Skip rows already claimed by another worker
      .lt('retry_count', 3) // Default cap; per-row max_retries still enforced on update
      .order('priority', { ascending: false }) // High priority first
      .order('created_at', { ascending: true }) // Oldest first
      .limit(50); // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch queued emails: ${fetchError.message}`);
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      console.log('No emails to process');
      return result;
    }

    console.log(`Processing ${queuedEmails.length} queued emails...`);

    // Process each email
    for (const email of queuedEmails) {
      result.processed++;
      
      try {
        const claimed = await claimEmailForProcessing(supabase, email.id, 'process-email-queue');
        if (!claimed) {
          continue;
        }

        // Validate incident notifications before processing
        if (email.module_name === 'incident') {
          console.log(`Validating incident notification for email ${email.id}`);
          const validationResult = await validateIncidentNotification(supabase, email);
          if (!validationResult.isValid) {
            console.log(`Incident validation failed for email ${email.id}: ${validationResult.reason}`);
            console.log(`Calling deactivateEmailAndUpdateLogs for email ${email.id}`);
            await deactivateEmailAndUpdateLogs(supabase, email.id, validationResult.reason || 'Incident validation failed');
            console.log(`deactivateEmailAndUpdateLogs completed for email ${email.id}`);
            result.failed++;
            result.errors.push(`Incident validation failed: ${validationResult.reason}`);
            continue; // Skip this email
          } else {
            console.log(`Incident validation passed for email ${email.id}`);
          }
        }
        
        const emailSent = await sendQueuedEmail(supabase, email);
        
        if (emailSent) {
          result.sent++;
          console.log(`Email sent successfully: ${email.id}`);
        } else {
          result.failed++;
          result.errors.push(`Failed to send email ${email.id}`);
          console.error(`Failed to send email: ${email.id}`);
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Error processing email ${email.id}: ${error.message}`);
        console.error(`Error processing email ${email.id}:`, error);
      }
    }

  } catch (error: any) {
    console.error('Error in processEmailQueue:', error);
    result.errors.push(`Queue processing error: ${error.message}`);
  }

  return result;
}

/**
 * Send a single queued email
 */
async function sendQueuedEmail(supabase: any, email: EmailQueueItem): Promise<boolean> {
  try {
    // Call the existing send-notification-email function with service role auth
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

    if (error) {
      console.error(`Error sending email ${email.id}:`, error);
      await updateEmailStatus(supabase, email.id, false, extractSendErrorMessage(error, data));
      return false;
    }

    if (data?.success === true) {
      // Mark email as sent
      await updateEmailStatus(supabase, email.id, true);
      return true;
    } else {
      console.error(`Email send failed for ${email.id}:`, data);
      await updateEmailStatus(supabase, email.id, false, extractSendErrorMessage(undefined, data));
      return false;
    }

  } catch (error: any) {
    console.error(`Error in sendQueuedEmail for ${email.id}:`, error);
    await updateEmailStatus(supabase, email.id, false, extractSendErrorMessage(error));
    return false;
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
          error_message: null,
          updated_at: currentTime
        })
        .eq('email_queue_id', emailId);

      if (logError) {
        console.error('Error updating notification log status to sent:', logError);
      }

      // Record centralized in-app notification only after successful delivery
      await recordCentralizedNotificationForEmail(supabase, emailId);

    } else {
      // First get the current retry count
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
          error_message: errorMessage,
          updated_at: currentTime
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
      console.error('Failed to create centralized notification from email queue:', rpcError);
    }
  } catch (error) {
    console.error('Error creating centralized notification from email queue:', error);
  }
}

/**
 * Validate incident notification before processing
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
      .eq('ticket_id', incidentId)
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

    // All validations passed
    return { isValid: true };
  } catch (error) {
    console.error('Error validating incident notification:', error);
    return { isValid: false, reason: `Validation error: ${error.message}` };
  }
}

/**
 * Deactivate email and update notification logs
 */
async function deactivateEmailAndUpdateLogs(supabase: any, emailId: string, reason: string): Promise<void> {
  try {
    const currentTime = new Date().toISOString();
    
    console.log(`Deactivating email ${emailId} with reason: ${reason}`);
    
    // Deactivate the email in email_queue
    const { error: emailError } = await supabase
      .from('email_queue')
      .update({
        active: false,
        error_message: reason, // Add error message to email_queue as well
        updated_at: currentTime,
        is_processing: false,
        processing_started_at: null,
        processing_by: null
      })
      .eq('id', emailId);

    if (emailError) {
      console.error('Error deactivating email:', emailError);
    } else {
      console.log(`Email ${emailId} deactivated successfully`);
    }

    // First, let's check if there are any notification logs for this email
    const { data: existingLogs, error: fetchError } = await supabase
      .from('notification_logs')
      .select('id, email_queue_id, status, module, type, recipient_email')
      .eq('email_queue_id', emailId);

    if (fetchError) {
      console.error('Error fetching notification logs:', fetchError);
    } else {
      console.log(`Found ${existingLogs?.length || 0} notification logs for email ${emailId}`);
      if (existingLogs && existingLogs.length > 0) {
        console.log('Notification log details:', existingLogs[0]);
      }
    }

    // Update corresponding notification_logs status to failed
    const { error: logError } = await supabase
      .from('notification_logs')
      .update({
        status: 'failed',
        error_message: reason,
        updated_at: currentTime
      })
      .eq('email_queue_id', emailId);

    if (logError) {
      console.error('Error updating notification log status to failed:', logError);
      console.log('This might mean no notification_logs entry exists with email_queue_id:', emailId);
      
      // Try to find notification logs by other means (module and type)
      const { data: emailData, error: emailFetchError } = await supabase
        .from('email_queue')
        .select('module_name, notification_type, recipient_email')
        .eq('id', emailId)
        .single();
      
      if (!emailFetchError && emailData) {
        console.log('Email data found:', emailData);
        
        // Try to update notification_logs by matching module, type, and recipient
        console.log('Attempting alternative notification log update with:', {
          module: emailData.module_name,
          type: emailData.notification_type,
          recipient_email: emailData.recipient_email
        });
        
        const { error: alternativeUpdateError } = await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: reason,
            updated_at: currentTime
          })
          .eq('module', emailData.module_name)
          .eq('type', emailData.notification_type)
          .eq('recipient_email', emailData.recipient_email)
          .is('email_queue_id', null); // Only update logs without email_queue_id
          
        if (alternativeUpdateError) {
          console.error('Alternative notification log update also failed:', alternativeUpdateError);
        } else {
          console.log('Updated notification logs using alternative method');
        }
      }
    } else {
      console.log(`Notification logs updated successfully for email ${emailId}`);
    }

    console.log(`Email ${emailId} deactivation process completed`);
  } catch (error) {
    console.error('Error deactivating email and updating logs:', error);
  }
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
      console.error(`Failed to claim email ${emailId} for processing:`, error);
      return false;
    }

    return Boolean(data?.id);
  } catch (error) {
    console.error(`Error claiming email ${emailId} for processing:`, error);
    return false;
  }
}