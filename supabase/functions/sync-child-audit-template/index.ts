// Edge Function: sync-child-audit-template
// ------------------------------------------------------------------
// Copies the Child Audit master template (from backoffice_* tables)
// into the per-client tables for ONE client at a time. The frontend
// invokes this function once per selected client so it can show
// progressive toast updates and isolate per-client failures.
//
// Request body: { client_id: string }
// Response:     { success: boolean, client_id, check_types_inserted, lookups_inserted, error? }

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

  if (req.method !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method not allowed' });
  }

  let body: { client_id?: string };
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(400, { success: false, error: 'Invalid JSON body' });
  }

  const clientId = (body?.client_id ?? '').trim();
  if (!clientId) {
    return jsonResponse(400, { success: false, error: 'client_id is required' });
  }

  try {
    // 1) Verify the client exists and is active
    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select('id, name, active')
      .eq('id', clientId)
      .single();

    if (clientErr || !clientRow) {
      return jsonResponse(404, {
        success: false,
        client_id: clientId,
        error: 'Client not found',
      });
    }

    // 2) Guard: if this client already has check_type rows, refuse to overwrite
    const { count: existingCount, error: countErr } = await supabase
      .from('child_audit_check_type')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (countErr) throw countErr;

    if ((existingCount ?? 0) > 0) {
      return jsonResponse(409, {
        success: false,
        client_id: clientId,
        already_seeded: true,
        error: `Client "${clientRow.name}" already has Child Audit templates (${existingCount} rows). Skipping.`,
      });
    }

    // 3) Fetch active check-type templates
    const { data: checkTypes, error: ctFetchErr } = await supabase
      .from('backoffice_child_audit_check_type')
      .select('type, key, alt_definition, active, attachements')
      .eq('active', true);

    if (ctFetchErr) throw ctFetchErr;

    let checkTypesInserted = 0;
    if (checkTypes && checkTypes.length > 0) {
      const ctRows = checkTypes.map((r: Record<string, unknown>) => ({
        ...r,
        client_id: clientId,
      }));
      const { error: ctInsertErr } = await supabase
        .from('child_audit_check_type')
        .upsert(ctRows, { onConflict: 'client_id,key', ignoreDuplicates: true });
      if (ctInsertErr) throw ctInsertErr;
      checkTypesInserted = ctRows.length;
    }

    // 4) Fetch active lookup templates (must come after check_type due to FK)
    const { data: lookups, error: luFetchErr } = await supabase
      .from('backoffice_child_audit_look_up')
      .select('item_group, type, label, active')
      .eq('active', true);

    if (luFetchErr) throw luFetchErr;

    let lookupsInserted = 0;
    if (lookups && lookups.length > 0) {
      const luRows = lookups.map((r: Record<string, unknown>) => ({
        ...r,
        client_id: clientId,
      }));
      const { error: luInsertErr } = await supabase
        .from('child_audit_look_up')
        .upsert(luRows, {
          onConflict: 'client_id,type,item_group,label',
          ignoreDuplicates: true,
        });
      if (luInsertErr) throw luInsertErr;
      lookupsInserted = luRows.length;
    }

    return jsonResponse(200, {
      success: true,
      client_id: clientId,
      client_name: clientRow.name,
      check_types_inserted: checkTypesInserted,
      lookups_inserted: lookupsInserted,
    });
  } catch (err) {
    console.error('sync-child-audit-template error for client', clientId, err);
    return jsonResponse(500, {
      success: false,
      client_id: clientId,
      error: (err as Error)?.message ?? 'Internal error',
    });
  }
});
