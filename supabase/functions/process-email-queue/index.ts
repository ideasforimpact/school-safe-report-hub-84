import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
    // Fetch pending emails (not sent, within retry limit, ordered by priority and creation time)
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('is_sent', false)
      .lt('retry_count', 3) // Only process emails that haven't exceeded max retries
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
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });

    if (error) {
      console.error(`Error sending email ${email.id}:`, error);
      await updateEmailStatus(supabase, email.id, false, error.message);
      return false;
    }

    if (data?.success === true) {
      // Mark email as sent
      await updateEmailStatus(supabase, email.id, true);
      return true;
    } else {
      console.error(`Email send failed for ${email.id}:`, data);
      await updateEmailStatus(supabase, email.id, false, 'Email send failed');
      return false;
    }

  } catch (error: any) {
    console.error(`Error in sendQueuedEmail for ${email.id}:`, error);
    await updateEmailStatus(supabase, email.id, false, error.message);
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
          error_message: null
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

    } else {
      // First get the current retry count
      const { data: emailData, error: fetchError } = await supabase
        .from('email_queue')
        .select('retry_count')
        .eq('id', emailId)
        .single();

      if (fetchError) {
        console.error('Error fetching current retry count:', fetchError);
        return;
      }

      // Update email_queue with failure info
      const { error: emailError } = await supabase
        .from('email_queue')
        .update({
          is_sent: false,
          retry_count: (emailData?.retry_count || 0) + 1,
          error_message: errorMessage,
          sent_at: null
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