import { supabase } from '@/integrations/supabase/client';

export type ChildAuditLookupValue = {
  id: string;
  label: string;
  active: boolean;
  item_group: string;
  type: string;
  definition?: string | null;
};

export type ChildAuditLookupGroup = {
  item_group: string | null;
  type: string;
  condition?: string | null;
  values: ChildAuditLookupValue[];
};

export type ChildAuditCheckTypeDetail = {
  id: string;
  type: string;
  key: string;
  active: boolean;
  attachements?: unknown;
  alt_definition?: unknown;
  lookup_groups: ChildAuditLookupGroup[];
};

export type ChildAuditLatestSelection = {
  record_id: string;
  check_type_id: string | null;
  physical_condition_ids: string[];
  behaviour_ids: string[];
  aggression_ids: string[];
  meltdown_occurred: boolean;
  notes: string | null;
  physical_where: Record<string, string[]>;
};

type EdgeResponse = {
  ok: boolean;
  version?: number;
  client_id?: string;
  student?: {
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
  check_type?: ChildAuditCheckTypeDetail[];
  latest_selection?: ChildAuditLatestSelection | null;
  error?: string;
  message?: string;
};

export async function fetchChildAuditStudentDetails(
  clientId: string,
  studentId: string
): Promise<{ checkTypes: ChildAuditCheckTypeDetail[]; latestSelection: ChildAuditLatestSelection | null }> {
  const { data, error } = await supabase.functions.invoke<EdgeResponse>('child-audit-student-details', {
    body: {
      client_id: clientId,
      student_id: studentId,
    },
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to load child audit student details');
  }

  if (!data?.ok || !Array.isArray(data.check_type)) {
    throw new Error(data?.message ?? data?.error ?? 'Invalid response from child-audit-student-details');
  }

  return {
    checkTypes: data.check_type,
    latestSelection: data.latest_selection ?? null,
  };
}
