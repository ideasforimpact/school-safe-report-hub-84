import { supabase } from '@/integrations/supabase/client';

// De-duplicate identical fetch-student-wellbeing-records invocations (handles React StrictMode double-effect in dev)
const _wellbeingInflight = new Map<string, Promise<any>>();
const _wellbeingRecent = new Map<string, { at: number; value: any }>();
const WELLBEING_DEDUPE_MS = 1200;
const invokeWellbeingFetch = async (body: Record<string, any>) => {
  const key = JSON.stringify(body);
  const now = Date.now();
  const recent = _wellbeingRecent.get(key);
  if (recent && now - recent.at < WELLBEING_DEDUPE_MS) return recent.value;
  const existing = _wellbeingInflight.get(key);
  if (existing) return existing;
  const request = supabase.functions
    .invoke('fetch-student-wellbeing-records', { method: 'POST', body })
    .then((res) => { _wellbeingRecent.set(key, { at: Date.now(), value: res }); return res; })
    .finally(() => { _wellbeingInflight.delete(key); });
  _wellbeingInflight.set(key, request);
  return request;
};

export type StudentWellbeingStatus = 'open' | 'closed' | 'under_observation';

export interface StudentWellbeingConsultation {
  id: string;
  consultation_provided_by: string;
  consultation_date: string;
  mode_id: string;
  mode_name?: string | null;
  support_notes: string | null;
  created_at: string;
}

export interface ConsultationActionTaken {
  id: string;
  taken_date: string;
  description: string;
  created_at: string;
}

export interface StudentFollowUpEntry {
  id: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface StudentWellbeingRecord {
  id: string;
  student_id: string | null;
  /** Human-readable student id from students table (e.g. STUD001). Use for display when present. */
  student_display_id?: string | null;
  student_name: string;
  section_id: string | null;
  grade_id: string | null;
  is_external_student?: boolean;
  external_student_involved?: {
    student?: { id?: string | null; name?: string | null } | null;
    grade?: { id?: string | null; name?: string | null } | null;
    section?: { id?: string | null; name?: string | null } | null;
  } | null;
  class: string;
  type_of_concern_id: string;
  concern: string;
  date_of_observation: string;
  status: StudentWellbeingStatus;
  next_follow_up: string | null;
  concern_notes: string | null;
  document_url?: { path: string; name: string }[];
  created_at: string;
  updated_at: string;
  consultations?: StudentWellbeingConsultation[];
  actions?: ConsultationActionTaken[];
  follow_up_entries?: StudentFollowUpEntry[];
}

export interface StudentWellbeingSummary {
  studentsCount: number;
  openCases: number;
  underObservation: number;
  closed: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface FetchStudentWellbeingResult {
  success: boolean;
  records: StudentWellbeingRecord[];
  summary: StudentWellbeingSummary;
  pagination: PaginationInfo;
}

export interface FetchStudentWellbeingParams {
  clientId: string;
  employeeId?: string;
  academicYear?: string;
  page?: number;
  search?: string;
  status?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  exportAll?: boolean;
}

export async function fetchStudentWellbeingRecords(
  params: FetchStudentWellbeingParams
): Promise<FetchStudentWellbeingResult> {
  const { data, error } = await invokeWellbeingFetch({
    clientId: params.clientId,
    employeeId: params.employeeId ?? null,
    academicYear: params.academicYear ?? null,
    page: params.page ?? 1,
    search: params.search ?? '',
    status: params.status ?? 'all',
    dateFrom: params.dateFrom ?? null,
    dateTo: params.dateTo ?? null,
    exportAll: params.exportAll ?? false,
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch student well-being records');
  }

  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to fetch records');
  }

  return {
    success: data?.success ?? true,
    records: data?.records ?? [],
    summary: data?.summary ?? {
      studentsCount: 0,
      openCases: 0,
      underObservation: 0,
      closed: 0,
    },
    pagination: data?.pagination ?? {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    },
  };
}

export interface UpdateStudentWellbeingRecordPayload {
  id: string;
  client_id: string;
  employee_id: string;
  student_id?: string | null;
  section_id?: string | null;
  grade_id?: string | null;
  student_name?: string | null;
  section_name?: string | null;
  grade_name?: string | null;
  is_external_student?: boolean;
  external_student_involved?: Record<string, unknown> | null;
  type_of_concern_id: string;
  date_of_observation: string;
  concern?: string | null;
  status?: StudentWellbeingStatus;
  next_follow_up?: string | null;
  /** Existing attachment paths to keep (merge with new uploads). */
  document_url?: { path: string; name: string }[];
  /** New files to upload (base64). */
  attachments?: { name: string; type: string; base64: string }[];
}

export async function updateStudentWellbeingRecord(
  payload: UpdateStudentWellbeingRecordPayload
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.functions.invoke('update-student-wellbeing-record', {
    method: 'POST',
    body: {
      id: payload.id,
      client_id: payload.client_id,
      employee_id: payload.employee_id,
      student_id: payload.student_id ?? null,
      section_id: payload.section_id ?? null,
      grade_id: payload.grade_id ?? null,
      student_name: payload.student_name ?? null,
      section_name: payload.section_name ?? null,
      grade_name: payload.grade_name ?? null,
      is_external_student: payload.is_external_student ?? false,
      external_student_involved: payload.external_student_involved ?? null,
      type_of_concern_id: payload.type_of_concern_id,
      date_of_observation: payload.date_of_observation,
      concern: payload.concern ?? null,
      status: payload.status ?? undefined,
      next_follow_up: payload.next_follow_up ?? null,
      document_url: payload.document_url ?? undefined,
      attachments: payload.attachments ?? undefined,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to update student well-being record');
  }

  if (data?.success === false) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to update record');
  }

  return {
    success: true,
    id: payload.id,
  };
}

export async function deleteStudentWellbeingRecord(
  recordId: string,
  clientId: string
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.functions.invoke('delete-student-wellbeing-record', {
    method: 'POST',
    body: {
      id: recordId,
      client_id: clientId,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete student well-being record');
  }

  if (data?.success === false) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to delete record');
  }

  return {
    success: true,
    id: recordId,
  };
}

export type ConsultationType = 'School Counselor' | 'Parent' | 'Teacher' | 'External Professional';

export interface CreateStudentConsultationPayload {
  client_id: string;
  employee_id: string;
  student_well_begin_management_id: string;
  consultation_provided_by: ConsultationType;
  consultation_date: string;
  mode_id: string;
  support_notes?: string | null;
}

export async function createStudentConsultation(
  payload: CreateStudentConsultationPayload
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.functions.invoke('create-student-consultation', {
    method: 'POST',
    body: {
      client_id: payload.client_id,
      employee_id: payload.employee_id,
      student_well_begin_management_id: payload.student_well_begin_management_id,
      consultation_provided_by: payload.consultation_provided_by,
      consultation_date: payload.consultation_date,
      mode_id: payload.mode_id,
      support_notes: payload.support_notes ?? null,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create consultation');
  }

  if (data?.success === false) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create consultation');
  }

  return {
    success: true,
    id: data?.id ?? '',
  };
}

export interface CreateConsultationActionPayload {
  client_id: string;
  employee_id: string;
  student_well_begin_management_id: string;
  taken_date: string;
  description: string;
}

export async function createConsultationAction(
  payload: CreateConsultationActionPayload
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.functions.invoke('create-consultation-action', {
    method: 'POST',
    body: {
      client_id: payload.client_id,
      employee_id: payload.employee_id,
      student_well_begin_management_id: payload.student_well_begin_management_id,
      taken_date: payload.taken_date,
      description: payload.description,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to add action');
  }

  if (data?.success === false) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to add action');
  }

  return {
    success: true,
    id: data?.id ?? '',
  };
}

export interface CreateStudentFollowUpEntryPayload {
  client_id: string;
  employee_id: string;
  student_well_begin_management_id: string;
  date: string;
  notes?: string | null;
}

export async function createStudentFollowUpEntry(
  payload: CreateStudentFollowUpEntryPayload
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.functions.invoke('create-student-follow-up-entry', {
    method: 'POST',
    body: {
      client_id: payload.client_id,
      employee_id: payload.employee_id,
      student_well_begin_management_id: payload.student_well_begin_management_id,
      date: payload.date,
      notes: payload.notes ?? null,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to add follow-up entry');
  }

  if (data?.success === false) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to add follow-up entry');
  }

  return {
    success: true,
    id: data?.id ?? '',
  };
}
