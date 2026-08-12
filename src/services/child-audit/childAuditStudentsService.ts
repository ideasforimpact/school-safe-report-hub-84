import { supabase } from '@/integrations/supabase/client';

export type ChildAuditStudentRow = {
  id: string;
  student_id: string;
  name: string;
  grade: string | null;
  section: string | null;
  grade_section: string;
  campus: string | null;
  created_at: string;
  updated_at: string;
};

type EdgeResponse = {
  ok: boolean;
  version?: number;
  client_id?: string;
  meta?: { count: number };
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  data?: ChildAuditStudentRow[];
  error?: string;
  message?: string;
};

export interface FetchChildAuditStudentsResult {
  students: ChildAuditStudentRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchChildAuditStudents(
  clientId: string,
  options?: { search?: string; page?: number; pageSize?: number }
): Promise<FetchChildAuditStudentsResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const body: { client_id: string; search?: string; page: number; page_size: number } = {
    client_id: clientId,
    page,
    page_size: pageSize,
  };
  const s = options?.search?.trim();
  if (s) body.search = s;

  const { data, error } = await supabase.functions.invoke<EdgeResponse>('child-audit-students', {
    body,
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to load students');
  }

  if (!data?.ok || !Array.isArray(data.data)) {
    throw new Error(data?.message ?? data?.error ?? 'Invalid response from child-audit-students');
  }

  const totalCount = data.total_count ?? data.meta?.count ?? data.data.length;
  const resolvedPageSize = data.page_size ?? pageSize;

  return {
    students: data.data,
    totalCount,
    page: data.page ?? page,
    pageSize: resolvedPageSize,
    totalPages: data.total_pages ?? Math.max(1, Math.ceil(totalCount / resolvedPageSize)),
  };
}
