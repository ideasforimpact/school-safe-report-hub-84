import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
 
async function GradeAndSectionIds(
  supabase: any,
  clientId: string,
  gradeId: string | null,
  sectionId: string | null
): Promise<{ gradeId: string | null; sectionId: string | null }> {
  let validGradeId = gradeId;
  let validSectionId = sectionId;
 
  if (validGradeId) {
    const { data } = await supabase
      .from('grades')
      .select('id')
      .eq('id', validGradeId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (!data) validGradeId = null;
  }
 
  if (validSectionId) {
    const { data } = await supabase
      .from('sections')
      .select('id')
      .eq('id', validSectionId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (!data) validSectionId = null;
  }
 
  return { gradeId: validGradeId, sectionId: validSectionId };
}
 
async function resolveInternalStudentId(params: {
  supabase: any;
  clientId: string;
  rawStudentId: string | null;
  studentIdentifier: string | null;
}): Promise<string | null> {
  const {
    supabase,
    clientId,
    rawStudentId,
    studentIdentifier,
  } = params;
 
  if (!rawStudentId && !studentIdentifier) return null;
 
  if (rawStudentId) {
    const { data: byId } = await supabase
      .from('students')
      .select('id')
      .eq('id', rawStudentId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (byId?.id) {
      return byId.id;
    }
  }
 
  if (studentIdentifier) {
    const { data: byStudentIdentifier } = await supabase
      .from('students')
      .select('id')
      .eq('client_id', clientId)
      .eq('student_id', studentIdentifier)
      .maybeSingle();
    if (byStudentIdentifier?.id) {
      return byStudentIdentifier.id;
    }
  }
 
  return null;
}
 
function buildIntegratedStudentInfo(params: {
  isExternal: boolean;
  externalStudentId: string | null;
  studentIdentifier: string | null;
  studentName: string | null;
  sectionId: string | null;
  gradeId: string | null;
}) {
  const { isExternal, externalStudentId, studentIdentifier, studentName, sectionId, gradeId } = params;
  if (!isExternal) return null;
  return {
    is_external: true,
    external_student_id: externalStudentId,
    student_id: studentIdentifier,
    student_name: studentName,
    section_id: sectionId,
    grade_id: gradeId,
  };
}
 
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
      student_identifier,
      studentIdentifier,
      student_name,
      studentName,
      is_external,
      isExternal,
      external_student_id,
      externalStudentId,
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
 
    const studentIdResolved = student_id ?? studentId ?? null;
    const typeOfConcernResolved = type_of_concern_id ?? typeOfConcernId;
    const dateObsResolved = date_of_observation ?? dateOfObservation;
    const sectionIdRaw = section_id ?? sectionId ?? null;
    const gradeIdRaw = grade_id ?? gradeId ?? null;
    const isExternalStudent = is_external === true || isExternal === true;
    const studentIdentifierResolved = student_identifier ?? studentIdentifier ?? null;
    const studentNameResolved = student_name ?? studentName ?? null;
    const externalStudentIdResolved = external_student_id ?? externalStudentId ?? null;
 
    if (!typeOfConcernResolved || !dateObsResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'type_of_concern_id and date_of_observation are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
 
    if (!isExternalStudent && !studentIdResolved && !studentIdentifierResolved) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'student_id is required for non-integrated students',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
 
    const { gradeId: gradeIdResolved, sectionId: sectionIdResolved } = await GradeAndSectionIds(
      supabase,
      clientIdResolved,
      gradeIdRaw,
      sectionIdRaw
    );
 
    const mappedStudentId = await resolveInternalStudentId({
      supabase,
      clientId: clientIdResolved,
      rawStudentId: studentIdResolved,
      studentIdentifier: studentIdentifierResolved,
    });
 
    if (!isExternalStudent && !mappedStudentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Selected student was not found for this client' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
 
    const integratedStudentInfo = buildIntegratedStudentInfo({
      isExternal: isExternalStudent || !mappedStudentId,
      externalStudentId: externalStudentIdResolved ?? studentIdResolved,
      studentIdentifier: studentIdentifierResolved,
      studentName: studentNameResolved,
      sectionId: sectionIdRaw,
      gradeId: gradeIdRaw,
    });
 
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
        student_id: mappedStudentId,
        section_id: mappedStudentId ? sectionIdResolved : null,
        grade_id: mappedStudentId ? gradeIdResolved : null,
        integrated_student_info: integratedStudentInfo,
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
