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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const clientId = body.clientId ?? body.client_id;
    const employeeId = body.employeeId ?? body.employee_id;
    const academicYear = body.academicYear ?? body.academic_year ?? null;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      clientId,
      url.pathname
    );
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Academic year: e.g. "2025-2026" => Apr 1, 2025 00:00 to Mar 31, 2026 23:59 (filter by created_at)
    let createdFrom: string | null = null;
    let createdTo: string | null = null;
    if (academicYear && typeof academicYear === 'string') {
      const match = academicYear.match(/^(\d{4})-(\d{4})$/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        const endYear = parseInt(match[2], 10);
        if (endYear === startYear + 1) {
          createdFrom = `${startYear}-04-01T00:00:00.000Z`;
          createdTo = `${endYear}-03-31T23:59:59.999Z`;
        }
      }
    }

    let query = supabase
      .from('student_well_begin_management')
      .select(`
        id,
        student_id,
        section_id,
        grade_id,
        type_of_concern_id,
        date_of_observation,
        concern,
        status,
        next_follow_up,
        document_url,
        created_at,
        updated_at,
        students:student_id(id, student_id, name, grade, section),
        sections:section_id(id, name),
        grades:grade_id(id, name),
        general_concern:type_of_concern_id(id, name)
      `)
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .is('deleted_at', null);

    if (createdFrom) query = query.gte('created_at', createdFrom);
    if (createdTo) query = query.lte('created_at', createdTo);

    const { data: records, error } = await query.order('date_of_observation', { ascending: false });

    if (error) {
      console.error('Error fetching student wellbeing records:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recordIds = (records || []).map((r: any) => r.id);
    const { data: consultationsRows } = recordIds.length > 0
      ? await supabase
          .from('student_consultation')
          .select('id, student_well_begin_management_id, consultation_provided_by, consultation_date, mode_id, support_notes, created_at, consultation_mode:mode_id(name)')
          .in('student_well_begin_management_id', recordIds)
      : { data: [] };

    const consultationsByRecordId: Record<string, any[]> = {};
    for (const id of recordIds) {
      consultationsByRecordId[id] = [];
    }
    for (const c of consultationsRows || []) {
      const rid = c.student_well_begin_management_id;
      const modeName = c.consultation_mode?.name ?? null;
      if (rid && consultationsByRecordId[rid]) {
        consultationsByRecordId[rid].push({
          id: c.id,
          consultation_provided_by: c.consultation_provided_by,
          consultation_date: c.consultation_date,
          mode_id: c.mode_id,
          mode_name: modeName,
          support_notes: c.support_notes ?? null,
          created_at: c.created_at,
        });
      }
    }

    const { data: actionsRows } = recordIds.length > 0
      ? await supabase
          .from('consultation_action_take')
          .select('id, student_well_begin_management_id, taken_date, description, created_at')
          .in('student_well_begin_management_id', recordIds)
          .eq('is_deleted', false)
          .is('deleted_at', null)
      : { data: [] };

    const actionsByRecordId: Record<string, any[]> = {};
    for (const id of recordIds) {
      actionsByRecordId[id] = [];
    }
    for (const a of actionsRows || []) {
      const rid = a.student_well_begin_management_id;
      if (rid && actionsByRecordId[rid]) {
        actionsByRecordId[rid].push({
          id: a.id,
          taken_date: a.taken_date,
          description: a.description,
          created_at: a.created_at,
        });
      }
    }

    const { data: followUpRows } = recordIds.length > 0
      ? await supabase
          .from('student_follow_up_entry')
          .select('id, student_well_begin_management_id, date, notes, created_at')
          .in('student_well_begin_management_id', recordIds)
          .order('date', { ascending: false })
      : { data: [] };

    const followUpByRecordId: Record<string, any[]> = {};
    for (const id of recordIds) {
      followUpByRecordId[id] = [];
    }
    for (const f of followUpRows || []) {
      const rid = f.student_well_begin_management_id;
      if (rid && followUpByRecordId[rid]) {
        followUpByRecordId[rid].push({
          id: f.id,
          date: f.date,
          notes: f.notes ?? null,
          created_at: f.created_at,
        });
      }
    }

    const list = (records || []).map((r: any) => {
      const student = r.students;
      const section = r.sections;
      const grade = r.grades;
      const concernType = r.general_concern;
      const classLabel =
        grade?.name && section?.name
          ? `Class ${grade.name}-${section.name}`
          : student
            ? `Class ${student.grade || ''}-${student.section || ''}`.replace(/^-|-$/g, '').trim() || '—'
            : '—';
      return {
        id: r.id,
        student_id: r.student_id,
        student_display_id: student?.student_id ?? null,
        student_name: student?.name ?? '—',
        section_id: r.section_id ?? null,
        grade_id: r.grade_id ?? null,
        class: classLabel,
        type_of_concern_id: r.type_of_concern_id,
        concern: concernType?.name ?? r.concern ?? '—',
        date_of_observation: r.date_of_observation,
        status: r.status ?? 'open',
        next_follow_up: r.next_follow_up ?? null,
        concern_notes: r.concern ?? null,
        document_url: r.document_url ?? [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        consultations: consultationsByRecordId[r.id] ?? [],
        actions: actionsByRecordId[r.id] ?? [],
        follow_up_entries: followUpByRecordId[r.id] ?? [],
      };
    });

    const uniqueStudentIds = new Set((list as any[]).map((x) => x.student_id));
    const openCount = (list as any[]).filter((x) => x.status === 'open').length;
    const underObservationCount = (list as any[]).filter((x) => x.status === 'under_observation').length;
    const closedCount = (list as any[]).filter((x) => x.status === 'closed').length;

    return new Response(
      JSON.stringify({
        success: true,
        records: list,
        summary: {
          studentsCount: uniqueStudentIds.size,
          openCases: openCount,
          underObservation: underObservationCount,
          closed: closedCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('fetch-student-wellbeing-records error:', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
