import { supabase } from '@/integrations/supabase/client';

export type ChildAuditLookupItem = {
  id: string;
  name: string;
  active: boolean;
};

export type ChildAuditLookups = {
  checkTypes: ChildAuditLookupItem[];
  physicalConditions: ChildAuditLookupItem[];
  behaviours: ChildAuditLookupItem[];
  meltdowns: ChildAuditLookupItem[];
  aggressions: ChildAuditLookupItem[];
};

export type ChildAuditRecord = {
  id: string;
  client_id: string;
  student_id: string;
  employee_id: string | null;
  check_type_id: string | null;
  physical_condition_ids: string[];
  behaviour_ids: string[];
  meltdown_occurred: boolean;
  aggression_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateChildAuditRecordPayload = Omit<
  ChildAuditRecord,
  'id' | 'created_at' | 'updated_at'
>;

export async function fetchChildAuditLookups(): Promise<ChildAuditLookups> {
  const [
    checkTypesRes,
    physicalRes,
    behaviourRes,
    meltdownRes,
    aggressionRes,
  ] = await Promise.all([
    supabase.from('child_check_type').select('id, name, active').eq('active', true).order('name'),
    supabase
      .from('child_audit_physical_condition')
      .select('id, name, active')
      .eq('active', true)
      .order('name'),
    supabase
      .from('child_audit_behaviour')
      .select('id, name, active')
      .eq('active', true)
      .order('name'),
    supabase
      .from('child_audit_meltdown')
      .select('id, name, active')
      .eq('active', true)
      .order('name'),
    supabase
      .from('child_audit_aggression')
      .select('id, name, active')
      .eq('active', true)
      .order('name'),
  ]);

  const error =
    checkTypesRes.error ||
    physicalRes.error ||
    behaviourRes.error ||
    meltdownRes.error ||
    aggressionRes.error;

  if (error) throw new Error(error.message);

  return {
    checkTypes: checkTypesRes.data ?? [],
    physicalConditions: physicalRes.data ?? [],
    behaviours: behaviourRes.data ?? [],
    meltdowns: meltdownRes.data ?? [],
    aggressions: aggressionRes.data ?? [],
  };
}

export async function fetchChildAuditRecordsByStudent(
  clientId: string,
  studentId: string
): Promise<ChildAuditRecord[]> {
  const { data, error } = await supabase
    .from('child_audit_records')
    .select('*')
    .eq('client_id', clientId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ChildAuditRecord[] | null) ?? [];
}

export async function createChildAuditRecord(
  payload: CreateChildAuditRecordPayload
): Promise<ChildAuditRecord> {
  const { data, error } = await supabase
    .from('child_audit_records')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ChildAuditRecord;
}
