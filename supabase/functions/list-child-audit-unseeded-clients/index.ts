// Edge Function: list-child-audit-unseeded-clients
// ------------------------------------------------------------------
// Returns the active clients that DO NOT yet have any rows in
// `child_audit_check_type`. The frontend cannot run this query
// directly because RLS on `child_audit_check_type` restricts the
// SELECT to the caller's own client_id, hiding all other clients'
// rows. This function bypasses RLS using the service-role key.
//
// Request body: none required (POST with empty body OK)
// Response: { success: true, clients: [{ id, name }] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Distinct client_ids that already have at least one row in
    //    child_audit_check_type. Service-role bypasses RLS.
    const { data: seededRows, error: seededErr } = await supabase
      .from('child_audit_check_type')
      .select('client_id');

    if (seededErr) throw seededErr;

    const seededSet = new Set<string>(
      (seededRows ?? [])
        .map((r: { client_id: string | null }) => r.client_id)
        .filter((id): id is string => !!id),
    );

    // 2) All active clients
    const { data: clientsRows, error: clientsErr } = await supabase
      .from('clients')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (clientsErr) throw clientsErr;

    const unseeded = (clientsRows ?? []).filter(
      (c: { id: string; name: string }) => !seededSet.has(c.id),
    );

    return jsonResponse(200, {
      success: true,
      seeded_count: seededSet.size,
      total_clients: clientsRows?.length ?? 0,
      clients: unseeded,
    });
  } catch (err) {
    console.error('list-child-audit-unseeded-clients error:', err);
    return jsonResponse(500, {
      success: false,
      error: (err as Error)?.message ?? 'Internal error',
    });
  }
});
