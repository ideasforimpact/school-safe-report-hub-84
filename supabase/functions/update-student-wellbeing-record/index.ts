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
    const {
      id,
      client_id,
      clientId,
      student_id,
      studentId,
      section_id,
      sectionId,
      grade_id,
      gradeId,
      type_of_concern_id,
      typeOfConcernId,
      date_of_observation,
      dateOfObservation,
      concern,
      status,
      next_follow_up,
      nextFollowUp,
    } = body;

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

    const studentIdResolved = student_id ?? studentId;
    const typeOfConcernResolved = type_of_concern_id ?? typeOfConcernId;
    const dateObsResolved = date_of_observation ?? dateOfObservation;

    if (!studentIdResolved || !typeOfConcernResolved || !dateObsResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'student_id, type_of_concern_id, and date_of_observation are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatePayload: Record<string, unknown> = {
      student_id: studentIdResolved,
      section_id: section_id ?? sectionId ?? null,
      grade_id: grade_id ?? gradeId ?? null,
      type_of_concern_id: typeOfConcernResolved,
      date_of_observation: dateObsResolved,
      concern: concern ?? null,
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined && status !== null) {
      updatePayload.status = status;
    }
    if (next_follow_up !== undefined || nextFollowUp !== undefined) {
      updatePayload.next_follow_up = next_follow_up ?? nextFollowUp ?? null;
    }

    const { error } = await supabase
      .from('student_well_begin_management')
      .update(updatePayload)
      .eq('id', recordId)
      .eq('client_id', clientIdResolved);

    if (error) {
      console.error('update-student-wellbeing-record error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: recordId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('update-student-wellbeing-record error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error)?.message ?? 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
