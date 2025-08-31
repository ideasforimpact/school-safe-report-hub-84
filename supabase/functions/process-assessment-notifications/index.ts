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
    // Fetch pending assessment notifications from email queue
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('is_sent', false)
      .eq('module_name', 'assessment')
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
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        });

        if (error || !data?.success) {
          console.error(`Failed to send assessment notification ${email.id}:`, error || data);
          await updateEmailStatus(supabase, email.id, false, error?.message || 'Send failed');
          failed++;
        } else {
          console.log(`Assessment notification sent successfully: ${email.id}`);
          await updateEmailStatus(supabase, email.id, true);
          sent++;
        }
      } catch (error: any) {
        console.error(`Error processing assessment notification ${email.id}:`, error);
        await updateEmailStatus(supabase, email.id, false, error.message);
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
      // Get current retry count and increment
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