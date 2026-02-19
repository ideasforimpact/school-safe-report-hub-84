import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    const body = await req.json().catch(() => ({}));
    const { id, client_id, clientId, employee_id, employeeId } = body;

    const recordId = id;
    if (!recordId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Record id is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientIdResolved = client_id ?? clientId;
    const employeeIdResolved = employee_id ?? employeeId ?? null;
    if (!clientIdResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'client_id is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      clientIdResolved,
      url.pathname
    );
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('student_well_begin_management')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('client_id', clientIdResolved);

    if (error) {
      console.error('delete-student-wellbeing-record error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit trail: log soft delete
    try {
      await supabase.from('student_wellbeing_audit_log').insert({
        wellbeing_id: recordId,
        client_id: clientIdResolved,
        field_changed: 'record',
        old_value: 'active',
        new_value: 'deleted',
        changed_by: employeeIdResolved,
        change_type: 'delete',
        description: 'Student well-being record marked as deleted',
        changes: null,
      });
    } catch (auditErr) {
      console.error('delete-student-wellbeing-record audit log error:', auditErr);
      // Do not fail the main operation if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: recordId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('delete-student-wellbeing-record error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error)?.message ?? 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
