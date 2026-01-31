import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTES_MIN = 2;
const NOTES_MAX = 2000;

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
      date,
      notes,
    } = body;

    const clientIdResolved = client_id ?? clientId;
    const employeeIdResolved = employee_id ?? employeeId;
    const wellbeingRecordId = student_well_begin_management_id ?? studentWellBeginManagementId;
    const dateInput = date;
    const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';

    if (!clientIdResolved) {
      return new Response(
        JSON.stringify({ success: false, error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employeeIdResolved) {
      return new Response(
        JSON.stringify({ success: false, error: 'employee_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wellbeingRecordId) {
      return new Response(
        JSON.stringify({ success: false, error: 'student_well_begin_management_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dateInput) {
      return new Response(
        JSON.stringify({ success: false, error: 'date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (notesTrimmed.length > 0) {
      if (notesTrimmed.length < NOTES_MIN) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `notes must be at least ${NOTES_MIN} characters when provided`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notesTrimmed.length > NOTES_MAX) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `notes must be at most ${NOTES_MAX} characters`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    const dateStr =
      typeof dateInput === 'string'
        ? dateInput.slice(0, 10)
        : dateInput;

    const { data: row, error } = await supabase
      .from('student_follow_up_entry')
      .insert({
        client_id: clientIdResolved,
        employee_id: employeeIdResolved,
        student_well_begin_management_id: wellbeingRecordId,
        date: dateStr,
        notes: notesTrimmed || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('create-student-follow-up-entry error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: row?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('create-student-follow-up-entry error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error)?.message ?? 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
