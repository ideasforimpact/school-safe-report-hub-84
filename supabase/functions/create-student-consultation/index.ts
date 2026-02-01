import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONSULTATION_TYPES = ['School Counselor', 'Parent', 'Teacher', 'External Professional'];

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
    const {
      client_id,
      clientId,
      employee_id,
      employeeId,
      student_well_begin_management_id,
      studentWellBeginManagementId,
      consultation_provided_by,
      consultationProvidedBy,
      consultation_date,
      consultationDate,
      mode_id,
      modeId,
      support_notes,
      supportNotes,
    } = body;

    const clientIdResolved = client_id ?? clientId;
    const employeeIdResolved = employee_id ?? employeeId;
    const wellbeingRecordId = student_well_begin_management_id ?? studentWellBeginManagementId;
    const providedBy = consultation_provided_by ?? consultationProvidedBy ?? '';
    const consultationDateInput = consultation_date ?? consultationDate;
    const modeIdResolved = mode_id ?? modeId;
    const notes = support_notes ?? supportNotes ?? null;

    if (!clientIdResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'client_id is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employeeIdResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'employee_id is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wellbeingRecordId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'student_well_begin_management_id is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!providedBy || !CONSULTATION_TYPES.includes(providedBy)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'consultation_provided_by must be one of: School Counselor, Parent, Teacher, External Professional',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!consultationDateInput) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'consultation_date is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!modeIdResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'mode_id is required',
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

    const consultationDateStr =
      typeof consultationDateInput === 'string'
        ? consultationDateInput.slice(0, 10)
        : consultationDateInput;

    const { data: row, error } = await supabase
      .from('student_consultation')
      .insert({
        client_id: clientIdResolved,
        employee_id: employeeIdResolved,
        student_well_begin_management_id: wellbeingRecordId,
        consultation_provided_by: providedBy,
        consultation_date: consultationDateStr,
        mode_id: modeIdResolved,
        support_notes: notes,
      })
      .select('id')
      .single();

    if (error) {
      console.error('create-student-consultation error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: row?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('create-student-consultation error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error)?.message ?? 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
