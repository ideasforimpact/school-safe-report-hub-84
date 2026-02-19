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
      client_id,
      clientId,
      employee_id,
      employeeId,
      student_id,
      studentId,
      type_of_concern_id,
      typeOfConcernId,
      date_of_observation,
      dateOfObservation,
      concern,
      section_id,
      sectionId,
      grade_id,
      gradeId,
      attachments,
    } = body;

    const clientIdResolved = client_id ?? clientId;
    const employeeIdResolved = employee_id ?? employeeId;

    if (!clientIdResolved || !employeeIdResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'client_id and employee_id are required',
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

    // All file uploads happen here (edge function). Client sends one request with attachments[] (base64);
    // we upload each file to storage server-side so there is only 1 client network call.
    const BUCKET = 'student_well_begin_attachements';
    const attachmentList = Array.isArray(attachments) ? attachments : [];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5;

    if (attachmentList.length > maxFiles) {
      return new Response(
        JSON.stringify({ success: false, error: `Maximum ${maxFiles} files allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: row, error } = await supabase
      .from('student_well_begin_management')
      .insert({
        client_id: clientIdResolved,
        employee_id: employeeIdResolved,
        student_id: studentIdResolved,
        section_id: section_id ?? sectionId ?? null,
        grade_id: grade_id ?? gradeId ?? null,
        type_of_concern_id: typeOfConcernResolved,
        date_of_observation: dateObsResolved,
        concern: concern ?? null,
        status: 'open',
        document_url: [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('create-student-wellbeing-record error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recordId = row?.id;
    const documentUrl: { path: string; name: string }[] = [];
    const seenNames = new Set<string>();

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
        console.error('create-student-wellbeing-record upload error:', uploadErr);
        return new Response(
          JSON.stringify({ success: false, error: `Upload failed: ${uploadErr.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      documentUrl.push({ path: filePath, name });
    }

    if (documentUrl.length > 0) {
      const { error: updateErr } = await supabase
        .from('student_well_begin_management')
        .update({ document_url: documentUrl })
        .eq('id', recordId)
        .eq('client_id', clientIdResolved);
      if (updateErr) {
        console.error('create-student-wellbeing-record document_url update error:', updateErr);
      }
    }

    // Audit trail: log record creation
    try {
      await supabase.from('student_wellbeing_audit_log').insert({
        wellbeing_id: recordId,
        client_id: clientIdResolved,
        field_changed: 'record',
        old_value: null,
        new_value: 'created',
        changed_by: employeeIdResolved,
        change_type: 'create',
        description: 'Student well-being record created',
        changes: null,
      });
    } catch (auditErr) {
      console.error('create-student-wellbeing-record audit log error:', auditErr);
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
    console.error('create-student-wellbeing-record error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
