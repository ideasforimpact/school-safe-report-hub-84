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
  data?: ChildAuditStudentRow[];
  error?: string;
  message?: string;
};

export async function fetchChildAuditStudents(
  clientId: string,
  options?: { search?: string }
): Promise<ChildAuditStudentRow[]> {
  const body: { client_id: string; search?: string } = { client_id: clientId };
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

  return data.data;
}
