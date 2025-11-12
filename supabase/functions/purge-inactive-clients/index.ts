import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PurgeCounts { [key: string]: number }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceRoleKey();

    if (!url || !key) {
      throw new Error('Missing URL or SERVICE_ROLE_KEY');
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const { maxRows } = await parseBody(req);
    const result = await purgeInactiveClients(supabase, maxRows ?? 50);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('purge-inactive-clients error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function parseBody(req: Request): Promise<{ maxRows?: number }> {
  try {
    if (req.method !== 'POST') return {};
    const body = await req.json().catch(() => ({}));
    const maxRows = typeof body?.maxRows === 'number' ? body.maxRows : undefined;
    return { maxRows };
  } catch {
    return {};
  }
}

async function purgeInactiveClients(supabase: any, maxRows: number) {
  // fetch inactive clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, creation_date')
    .eq('active', false)
    .order('creation_date', { ascending: true })
    .limit(maxRows);

  if (error) throw new Error(`Failed to fetch inactive clients: ${error.message}`);

  const results: Array<{ client_id: string; client_name: string; deleted_counts: PurgeCounts; status: string; error?: string }> = [];

  for (const c of clients || []) {
    const counts: PurgeCounts = {};
    let logId: number | null = null;
    try {
      // create log row
      const { data: logRow, error: logErr } = await supabase
        .from('client_purge_log')
        .insert({ client_id: c.id, client_name: c.name })
        .select('id')
        .single();
      if (logErr) throw new Error(`Failed to create purge log: ${logErr.message}`);
      logId = logRow.id;

      // just delete client; cascades handle dependents
      const { error: delClientErr } = await supabase.from('clients').delete().eq('id', c.id);
      if (delClientErr) throw new Error(`Delete client failed: ${delClientErr.message}`);

      // update log
      await supabase
        .from('client_purge_log')
        .update({ status: 'success', finished_at: new Date().toISOString(), deleted_counts: counts })
        .eq('id', logId);

      results.push({ client_id: c.id, client_name: c.name, deleted_counts: counts, status: 'success' });
    } catch (e: any) {
      if (logId) {
        await supabase
          .from('client_purge_log')
          .update({ status: 'error', finished_at: new Date().toISOString(), error_message: String(e?.message || e) })
          .eq('id', logId);
      }
      results.push({ client_id: c.id, client_name: c.name, deleted_counts: counts, status: 'error', error: String(e?.message || e) });
    }
  }

  return { processed: results.length, results };
}

// with CASCADE in place, we no longer need to chase child tables explicitly


