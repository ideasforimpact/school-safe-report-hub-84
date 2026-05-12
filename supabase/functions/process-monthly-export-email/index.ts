import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MonthlyExportEmailRow {
  id: string;
  client_id: string;
  queue_id: string | null;
  target_employee_id: string;
  recipient_email: string;
  recipient_name: string | null;
  body: string | null;
  subject: string | null;
  is_send: boolean;
  send_at: string | null;
  document_url: string | null;
  error_msg: Record<string, unknown> | null;
  retry_count: number;
  max_retries: number;
  scheduled_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

const BATCH_SIZE = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    console.log('Starting monthly export email processing...');
    const result = await processMonthlyExportEmails(supabase);
    console.log('Monthly export email processing completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly export email queue processed',
        result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error processing monthly export emails:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process monthly export emails',
        error: message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Fetch unsent monthly_export_email rows (is_send = false, active = true, retry_count < max_retries)
 * and send each via send-notification-email; update is_send/send_at on success,
 * or increment retry_count and set error_msg on failure (max 2 retries).
 */
async function processMonthlyExportEmails(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, sent: 0, failed: 0, errors: [] };

  try {
    const { data: rows, error: fetchError } = await supabase
      .from('monthly_export_email')
      .select('*')
      .eq('is_send', false)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch monthly_export_email: ${fetchError.message}`);
    }

    const pending = (rows ?? []).filter(
      (r: MonthlyExportEmailRow) => r.retry_count < r.max_retries
    );

    if (pending.length === 0) {
      console.log('No monthly export emails to process');
      return result;
    }

    console.log(`Processing ${pending.length} monthly export email(s)...`);

    for (const row of pending) {
      result.processed++;
      try {
        const sent = await sendMonthlyExportEmail(supabase, row);
        if (sent) {
          result.sent++;
          console.log(`Monthly export email sent: ${row.id}`);
        } else {
          result.failed++;
          result.errors.push(`Failed to send monthly export email ${row.id}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        result.failed++;
        result.errors.push(`Error processing ${row.id}: ${msg}`);
        console.error(`Error processing monthly export email ${row.id}:`, err);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error in processMonthlyExportEmails:', err);
    result.errors.push(msg);
  }

  return result;
}

/**
 * Send one monthly export email via send-notification-email and update monthly_export_email.
 * On success: is_send = true, send_at = now(), error_msg = null.
 * On failure: retry_count += 1, error_msg = { message, attempted_at }; no notification_logs.
 */
async function sendMonthlyExportEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: MonthlyExportEmailRow
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        to: row.recipient_email,
        toName: row.recipient_name ?? undefined,
        subject: row.subject ?? 'Monthly compliance report',
        body: row.body ?? '',
        priority: 'normal',
      },
      headers: {
        Authorization: `Bearer ${getSupabaseServiceRoleKey()}`,
      },
    });

    if (error) {
      await updateMonthlyExportEmailStatus(supabase, row.id, false, row.retry_count, error.message);
      return false;
    }

    if (data?.success === true) {
      await updateMonthlyExportEmailStatus(supabase, row.id, true);
      return true;
    }

    const failMessage = typeof data?.error === 'string' ? data.error : 'Email send failed';
    await updateMonthlyExportEmailStatus(supabase, row.id, false, row.retry_count, failMessage);
    return false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await updateMonthlyExportEmailStatus(supabase, row.id, false, row.retry_count, message);
    return false;
  }
}

/**
 * Update monthly_export_email: on success set is_send=true, send_at, clear error_msg;
 * on failure set retry_count+1, error_msg (jsonb), leave is_send false.
 */
async function updateMonthlyExportEmailStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  isSent: boolean,
  currentRetryCount?: number,
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    if (isSent) {
      const { error } = await supabase
        .from('monthly_export_email')
        .update({
          is_send: true,
          send_at: now,
          error_msg: null,
          updated_at: now,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating monthly_export_email (sent):', error);
      }
    } else {
      const newRetryCount = (currentRetryCount ?? 0) + 1;
      const errorPayload = {
        message: errorMessage ?? 'Unknown error',
        attempted_at: now,
      };

      const { error } = await supabase
        .from('monthly_export_email')
        .update({
          retry_count: newRetryCount,
          error_msg: errorPayload,
          updated_at: now,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating monthly_export_email (failed):', error);
      }
    }
  } catch (err) {
    console.error('Error in updateMonthlyExportEmailStatus:', err);
  }
}
