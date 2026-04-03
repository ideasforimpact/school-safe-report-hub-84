import { supabase } from '@/integrations/supabase/client';

export type ChildAuditLookupItem = {
  id: string;
  name: string;
  active: boolean;
  definition?: string | null;
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
  physical_where?: Record<string, string[]>;
  behaviour_ids: string[];
  meltdown_occurred: boolean;
  meltdown_definition: string[];
  aggression_ids: string[];
  notes: string | null;
  attachments: ChildAuditRecordAttachment[];
  created_at: string;
  updated_at: string;
};

export type ChildAuditRecordAttachment = {
  id: string;
  record_id: string;
  client_id: string;
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type CreateChildAuditRecordPayload = Omit<
  ChildAuditRecord,
  'id' | 'created_at' | 'updated_at' | 'attachments'
> & {
  physical_where?: Record<string, string[]>;
  meltdown_definition?: string[];
  attachments?: Array<{
    file_name: string;
    mime_type?: string | null;
    file_size?: number | null;
    base64: string;
  }>;
};

export async function fetchChildAuditLookups(): Promise<ChildAuditLookups> {
  return {
    checkTypes: [],
    physicalConditions: [],
    behaviours: [],
    meltdowns: [],
    aggressions: [],
  };
}

export async function fetchChildAuditRecordsByStudent(
  clientId: string,
  studentId: string
): Promise<ChildAuditRecord[]> {
  const { data: recordsData, error: recordsError } = await (supabase as any)
    .from('child_audit_record')
    .select('*')
    .eq('client_id', clientId)
    .eq('student_id', studentId)
    .order('submission_time', { ascending: false });

  if (recordsError) throw new Error(recordsError.message);

  const records = (recordsData ?? []) as Array<Record<string, any>>;
  if (records.length === 0) return [];

  const recordIds = records.map((row) => row.id);
  const { data: itemsData, error: itemsError } = await (supabase as any)
    .from('child_audit_record_item')
    .select('id, record_id, lookup_id, item_group')
    .in('record_id', recordIds);

  if (itemsError) throw new Error(itemsError.message);

  const items = (itemsData ?? []) as Array<{
    id: string;
    record_id: string;
    lookup_id: string | null;
    item_group: string;
  }>;
  const byRecord = new Map<string, Array<{ id: string; lookup_id: string | null; item_group: string }>>();

  for (const item of items) {
    const list = byRecord.get(item.record_id) ?? [];
    list.push({ id: item.id, lookup_id: item.lookup_id, item_group: item.item_group });
    byRecord.set(item.record_id, list);
  }

  const itemIds = items.map((item) => item.id);
  const locationRows =
    itemIds.length > 0
      ? (
          await (supabase as any)
            .from('child_audit_record_item_location')
            .select('record_item_id, body_part')
            .in('record_item_id', itemIds)
        ).data ?? []
      : [];

  const locationsByItem = new Map<string, string[]>();
  for (const row of locationRows as Array<{ record_item_id: string; body_part: string }>) {
    const list = locationsByItem.get(row.record_item_id) ?? [];
    list.push(row.body_part);
    locationsByItem.set(row.record_item_id, list);
  }

  const { data: attachmentsData, error: attachmentsError } = await (supabase as any)
    .from('child_audit_record_attachment')
    .select('id, record_id, client_id, bucket, file_path, file_name, mime_type, file_size, created_at')
    .in('record_id', recordIds)
    .order('created_at', { ascending: true });

  if (attachmentsError) throw new Error(attachmentsError.message);

  const attachmentsByRecord = new Map<string, ChildAuditRecordAttachment[]>();
  for (const row of (attachmentsData ?? []) as Array<ChildAuditRecordAttachment>) {
    const list = attachmentsByRecord.get(row.record_id) ?? [];
    list.push(row);
    attachmentsByRecord.set(row.record_id, list);
  }

  return records.map((row) => {
    const selected = byRecord.get(row.id) ?? [];
    const physical = selected
      .filter((item) => item.item_group === 'physical_condition' && item.lookup_id)
      .map((item) => item.lookup_id as string);
    const aggression = selected
      .filter((item) => item.item_group === 'aggression' && item.lookup_id)
      .map((item) => item.lookup_id as string);
    const meltdown = selected.some((item) => item.item_group === 'meltdown');
    const meltdownItem = selected.find((item) => item.item_group === 'meltdown');
    const behaviour = selected
      .filter(
        (item) =>
          item.item_group !== 'physical_condition' &&
          item.item_group !== 'aggression' &&
          item.item_group !== 'meltdown' &&
          item.lookup_id
      )
      .map((item) => item.lookup_id as string);

    const physical_where: Record<string, string[]> = {};
    for (const item of selected) {
      if (item.item_group !== 'physical_condition' || !item.lookup_id) continue;
      const bodyParts = locationsByItem.get(item.id) ?? [];
      if (bodyParts.length > 0) {
        physical_where[item.lookup_id] = bodyParts;
      }
    }

    const meltdown_definition =
      meltdownItem && meltdownItem.lookup_id
        ? (locationsByItem.get(meltdownItem.id) ?? [])
        : [];

    return {
      id: row.id,
      client_id: row.client_id,
      student_id: row.student_id,
      employee_id: row.employee_id ?? null,
      check_type_id: row.check_type_id ?? null,
      physical_condition_ids: physical,
      physical_where,
      behaviour_ids: behaviour,
      meltdown_occurred: meltdown,
      meltdown_definition,
      aggression_ids: aggression,
      notes: row.notes ?? null,
      attachments: attachmentsByRecord.get(row.id) ?? [],
      created_at: row.submission_time ?? row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    } as ChildAuditRecord;
  });
}

type SaveEdgeResponse = {
  ok: boolean;
  version?: number;
  error?: string;
  message?: string;
  record?: ChildAuditRecord;
};

export async function createChildAuditRecord(
  payload: CreateChildAuditRecordPayload
): Promise<ChildAuditRecord> {
  const { data, error } = await supabase.functions.invoke<SaveEdgeResponse>('child-audit-save-check', {
    body: {
      client_id: payload.client_id,
      student_id: payload.student_id,
      employee_id: payload.employee_id,
      check_type_id: payload.check_type_id,
      physical_condition_ids: payload.physical_condition_ids,
      behaviour_ids: payload.behaviour_ids,
      aggression_ids: payload.aggression_ids,
      meltdown_occurred: payload.meltdown_occurred,
      meltdown_definition: payload.meltdown_definition ?? [],
      notes: payload.notes,
      physical_where: payload.physical_where ?? {},
      attachments: payload.attachments ?? [],
    },
  });

  if (error) throw new Error(error.message ?? 'Failed to save child audit check');
  if (!data?.ok || !data.record) {
    throw new Error(data?.message ?? data?.error ?? 'Invalid response from child-audit-save-check');
  }

  return data.record;
}
