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
      employee_id,
      employeeId,
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

    const employeeIdResolved = employee_id ?? employeeId ?? null;

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

    // Load existing row so we can compute field-by-field changes for audit trail
    const { data: existingRow, error: existingError } = await supabase
      .from('student_well_begin_management')
      .select('student_id, section_id, grade_id, type_of_concern_id, date_of_observation, concern, status, next_follow_up')
      .eq('id', recordId)
      .eq('client_id', clientIdResolved)
      .single();

    if (existingError || !existingRow) {
      console.error('update-student-wellbeing-record existing row error:', existingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Build per-field audit entries similar to assessment audit log
    const changes: { field: string; old_value: string | null; new_value: string | null; change_type: string }[] = [];
    const current = existingRow as any;

    const pushChange = (field: string, oldVal: unknown, newVal: unknown, changeType = 'field_update') => {
      const oldStr = oldVal === null || oldVal === undefined ? null : String(oldVal);
      const newStr = newVal === null || newVal === undefined ? null : String(newVal);
      if (oldStr === newStr) return;
      changes.push({ field, old_value: oldStr, new_value: newStr, change_type: changeType });
    };

    pushChange('student_id', current.student_id, studentIdResolved);
    pushChange('section_id', current.section_id ?? null, section_id ?? sectionId ?? null);
    pushChange('grade_id', current.grade_id ?? null, grade_id ?? gradeId ?? null);
    pushChange('type_of_concern_id', current.type_of_concern_id, typeOfConcernResolved);
    pushChange('date_of_observation', current.date_of_observation, dateObsResolved);
    pushChange('concern', current.concern ?? null, concern ?? null);

    const newStatus = status !== undefined && status !== null ? status : current.status;
    pushChange('status', current.status ?? null, newStatus ?? null, 'status_change');

    const newNextFollow =
      next_follow_up !== undefined || nextFollowUp !== undefined
        ? next_follow_up ?? nextFollowUp ?? null
        : current.next_follow_up ?? null;
    pushChange('next_follow_up', current.next_follow_up ?? null, newNextFollow);

    if (changes.length > 0) {
      const auditRows = changes.map((c) => ({
        wellbeing_id: recordId,
        client_id: clientIdResolved,
        field_changed: c.field,
        old_value: c.old_value,
        new_value: c.new_value,
        changed_by: employeeIdResolved,
        change_type: c.change_type,
        description: null,
        changes: null,
      }));

      try {
        await supabase.from('student_wellbeing_audit_log' as any).insert(auditRows as any);
      } catch (auditErr) {
        console.error('update-student-wellbeing-record audit log error:', auditErr);
        // do not fail main update if audit logging fails
      }
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
