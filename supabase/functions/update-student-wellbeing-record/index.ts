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
      attachments,
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

    // All file uploads happen here (edge function). Client sends one request with attachments[] (base64);
    // we upload each new file to storage server-side so there is only 1 client network call (add and edit).
    const BUCKET = 'student_well_begin_attachements';
    const attachmentList = Array.isArray(attachments) ? attachments : [];
    const maxSizeBytes = 10 * 1024 * 1024;
    const maxFilesTotal = 5;

    const { data: existingRow } = await supabase
      .from('student_well_begin_management')
      .select('student_id, section_id, grade_id, type_of_concern_id, date_of_observation, concern, status, next_follow_up, document_url')
      .eq('id', recordId)
      .eq('client_id', clientIdResolved)
      .single();

    const existingDocs: { path: string; name: string }[] = Array.isArray(existingRow?.document_url)
      ? existingRow.document_url
      : [];

    const newDocs: { path: string; name: string }[] = [];
    const seenNames = new Set(existingDocs.map((d) => d.name.toLowerCase()));

    if (attachmentList.length > 0) {
      const totalAfter = existingDocs.length + attachmentList.length;
      if (totalAfter > maxFilesTotal) {
        return new Response(
          JSON.stringify({ success: false, error: `Maximum ${maxFilesTotal} files allowed in total` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      for (const att of attachmentList) {
        const name = att?.name ?? '';
        const type = att?.type ?? 'application/octet-stream';
        const base64 = att?.base64 ?? '';
        if (!name || !base64) continue;
        const nameLower = name.toLowerCase();
        if (seenNames.has(nameLower)) {
          return new Response(
            JSON.stringify({ success: false, error: `Duplicate file name: ${name}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        seenNames.add(nameLower);
        const buf = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        if (buf.length > maxSizeBytes) {
          return new Response(
            JSON.stringify({ success: false, error: `File "${name}" exceeds 10MB` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${clientIdResolved}/${recordId}/${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, buf, { contentType: type, upsert: true });
        if (uploadErr) {
          console.error('update-student-wellbeing-record upload error:', uploadErr);
          return new Response(
            JSON.stringify({ success: false, error: `Upload failed: ${uploadErr.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        newDocs.push({ path: filePath, name });
      }
    }

    const documentUrl = [...existingDocs, ...newDocs];

    const updatePayload: Record<string, unknown> = {
      student_id: studentIdResolved,
      section_id: section_id ?? sectionId ?? null,
      grade_id: grade_id ?? gradeId ?? null,
      type_of_concern_id: typeOfConcernResolved,
      date_of_observation: dateObsResolved,
      concern: concern ?? null,
      document_url: documentUrl,
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined && status !== null) {
      updatePayload.status = status;
    }
    if (next_follow_up !== undefined || nextFollowUp !== undefined) {
      updatePayload.next_follow_up = next_follow_up ?? nextFollowUp ?? null;
    }

    // Build audit changes compared to existing row
    const changes: { field: string; old_value: string | null; new_value: string | null }[] = [];
    if (existingRow) {
      const current = existingRow as any;

      if (current.student_id !== studentIdResolved) {
        changes.push({
          field: 'student_id',
          old_value: current.student_id ?? null,
          new_value: studentIdResolved ?? null,
        });
      }
      const newSection = section_id ?? sectionId ?? null;
      if ((current.section_id ?? null) !== newSection) {
        changes.push({
          field: 'section_id',
          old_value: current.section_id ?? null,
          new_value: newSection,
        });
      }
      const newGrade = grade_id ?? gradeId ?? null;
      if ((current.grade_id ?? null) !== newGrade) {
        changes.push({
          field: 'grade_id',
          old_value: current.grade_id ?? null,
          new_value: newGrade,
        });
      }
      if (current.type_of_concern_id !== typeOfConcernResolved) {
        changes.push({
          field: 'type_of_concern_id',
          old_value: current.type_of_concern_id ?? null,
          new_value: typeOfConcernResolved ?? null,
        });
      }
      if (String(current.date_of_observation ?? '') !== String(dateObsResolved ?? '')) {
        changes.push({
          field: 'date_of_observation',
          old_value: current.date_of_observation ? String(current.date_of_observation) : null,
          new_value: dateObsResolved ? String(dateObsResolved) : null,
        });
      }
      if ((current.concern ?? null) !== (concern ?? null)) {
        changes.push({
          field: 'concern',
          old_value: current.concern ?? null,
          new_value: concern ?? null,
        });
      }
      const newStatus = status !== undefined && status !== null ? status : current.status;
      if (current.status !== newStatus) {
        changes.push({
          field: 'status',
          old_value: current.status ?? null,
          new_value: newStatus ?? null,
        });
      }
      const newNextFollow =
        next_follow_up !== undefined || nextFollowUp !== undefined
          ? next_follow_up ?? nextFollowUp ?? null
          : current.next_follow_up ?? null;
      if ((current.next_follow_up ?? null) !== newNextFollow) {
        changes.push({
          field: 'next_follow_up',
          old_value: current.next_follow_up ?? null,
          new_value: newNextFollow,
        });
      }
      // Compare document_url as JSON strings
      const existingDocsJson = JSON.stringify(existingDocs ?? []);
      const newDocsJson = JSON.stringify(documentUrl ?? []);
      if (existingDocsJson !== newDocsJson) {
        changes.push({
          field: 'document_url',
          old_value: existingDocsJson,
          new_value: newDocsJson,
        });
      }
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

    // Write audit log entry if there were any changes
    if (changes.length > 0) {
      const primaryChange = changes[0];
      const descriptionFields = changes.map((c) => c.field).join(', ');
      const description =
        changes.length === 1
          ? `Updated ${primaryChange.field}`
          : `Updated fields: ${descriptionFields}`;

      try {
        await supabase.from('student_wellbeing_audit_log').insert({
          wellbeing_id: recordId,
          client_id: clientIdResolved,
          field_changed: changes.length === 1 ? primaryChange.field : 'multiple_fields',
          old_value: primaryChange.old_value,
          new_value: primaryChange.new_value,
          changed_by: employeeIdResolved,
          change_type: 'field_update',
          description,
          changes,
        });
      } catch (auditErr) {
        console.error('update-student-wellbeing-record audit log error:', auditErr);
        // Do not fail the main operation if audit logging fails
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
