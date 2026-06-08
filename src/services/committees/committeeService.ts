import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/fileTypes';

export interface Committee {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  chairperson_employee_id: string | null;
  chairperson_name?: string | null;
  status: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  attachments?: {
    id: string;
    committee_id?: string;
    storage_bucket?: string;
    storage_path?: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
  }[];
}

export interface CommitteePayload {
  clientId: string;
  name: string;
  description?: string;
  members?: CommitteeMemberInput[];
  attachments?: FileItem[];
  status?: boolean;
  employeeId?: string | null;
}

export interface CommitteeDefault {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface CommitteeMemberRole {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface CommitteeMemberInput {
  employeeId: string;
  role: string;
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  client_id: string;
  employee_id: string;
  role: string | null;
}

export interface CommitteeEvent {
  id: string;
  committee_id: string;
  client_id: string;
  event_type: 'mom' | 'event';
  title: string;
  description: string | null;
  event_date: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  participants?: string[];
  participant_names?: string[];
  created_by_name?: string | null;
  attachments?: {
    id: string;
    event_id?: string;
    storage_bucket?: string;
    storage_path?: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
  }[];
}

export interface CommitteeEventPayload {
  eventId?: string;
  committeeId: string;
  clientId: string;
  eventType: 'mom' | 'event';
  title: string;
  description?: string;
  eventDate: string;
  participantIds: string[];
  attachments?: FileItem[];
  employeeId?: string | null;
}

// ─── Central invoker ──────────────────────────────────────────────────────────

async function invokeCommittee<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(`committee-management/${action}`, {
    body: payload,
  });
  if (error) throw new Error(error.message || `Failed: ${action}`);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export interface FetchCommitteesParams {
  clientId: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface FetchCommitteesResult {
  committees: Committee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// In-flight deduplication — collapses simultaneous calls with identical params.
const listInflight = new Map<string, Promise<FetchCommitteesResult>>();

export const fetchCommittees = async ({
  clientId,
  page = 1,
  pageSize = 10,
  search = '',
}: FetchCommitteesParams): Promise<FetchCommitteesResult> => {
  const key = `${clientId}:${page}:${pageSize}:${search}`;
  const inflight = listInflight.get(key);
  if (inflight) return inflight;

  const request = invokeCommittee<{
    committees: Committee[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('list_committees', { client_id: clientId, page, page_size: pageSize, search })
    .then((data) => ({
      committees: data.committees || [],
      totalCount: data.total_count,
      page: data.page,
      pageSize: data.page_size,
      totalPages: data.total_pages,
    }))
    .finally(() => listInflight.delete(key));

  listInflight.set(key, request);
  return request;
};

export const fetchCommitteeById = async (
  committeeId: string,
  clientId: string
): Promise<Committee | null> => {
  return invokeCommittee<Committee>('get_committee', { client_id: clientId, committee_id: committeeId });
};

export const fetchCommitteeDefaults = async (): Promise<CommitteeDefault[]> => {
  const defaults = [
    'School Management Committee',
    'POCSO / Child Protection Committee',
    'Internal Complaints Committee (POSH)',
    'Anti-Bullying / Anti-Ragging Committee',
    'School Safety Committee',
    'Disaster Management Committee',
    'Transport Safety Committee',
    'Grievance Redressal Committee',
    'Health & Wellness Committee',
    'Cyber Safety Committee',
    'Discipline Committee',
    'Inclusion / Special Needs Committee',
  ];

  return defaults.map((name, index) => ({
    id: `manual-default-${index + 1}`,
    name,
    sort_order: index + 1,
    active: true,
  }));
};

export const fetchCommitteeMemberRoles = async (): Promise<CommitteeMemberRole[]> => {
  const { data, error } = await supabase
    .from('committee_member_roles' as any)
    .select('id, name, sort_order, active')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch committee member roles');
  }

  return (data || []) as CommitteeMemberRole[];
};

export const createCommittee = async (payload: CommitteePayload): Promise<Committee> =>
  invokeCommittee<Committee>('create_committee', {
    client_id: payload.clientId,
    employee_id: payload.employeeId || null,
    name: payload.name,
    description: payload.description || null,
    status: payload.status ?? true,
    members: payload.members || [],
    attachments: payload.attachments || [],
  });

export const updateCommittee = async (
  committeeId: string,
  payload: CommitteePayload
): Promise<Committee> =>
  invokeCommittee<Committee>('update_committee', {
    client_id: payload.clientId,
    employee_id: payload.employeeId || null,
    committee_id: committeeId,
    name: payload.name,
    description: payload.description || null,
    status: payload.status ?? true,
    members: payload.members || [],
    attachments: payload.attachments || [],
  });

export const deleteCommittee = async (
  committeeId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> =>
  invokeCommittee('delete_committee', {
    client_id: clientId,
    committee_id: committeeId,
    employee_id: employeeId || null,
  });

export const createCommitteeEvent = async (payload: CommitteeEventPayload): Promise<CommitteeEvent> =>
  invokeCommittee<CommitteeEvent>('create_event', {
    client_id: payload.clientId,
    employee_id: payload.employeeId || null,
    committee_id: payload.committeeId,
    event_type: payload.eventType,
    title: payload.title,
    description: payload.description || null,
    event_date: payload.eventDate,
    participant_ids: payload.participantIds || [],
    attachments: payload.attachments || [],
  });

export const updateCommitteeEvent = async (payload: CommitteeEventPayload): Promise<CommitteeEvent> => {
  if (!payload.eventId) throw new Error('Event ID is required');
  return invokeCommittee<CommitteeEvent>('update_event', {
    client_id: payload.clientId,
    employee_id: payload.employeeId || null,
    event_id: payload.eventId,
    event_type: payload.eventType,
    title: payload.title,
    description: payload.description || null,
    event_date: payload.eventDate,
    participant_ids: payload.participantIds || [],
    attachments: payload.attachments || [],
  });
};

export const fetchCommitteeEvents = async (
  committeeId: string,
  clientId: string
): Promise<CommitteeEvent[]> =>
  invokeCommittee<CommitteeEvent[]>('list_events', { client_id: clientId, committee_id: committeeId });

export interface EventsPageData {
  committee: Committee | null;
  events: CommitteeEvent[];
  members: CommitteeMember[];
}

const eventsPageInflight = new Map<string, Promise<EventsPageData>>();

export const fetchEventsPageData = async (
  committeeId: string,
  clientId: string,
): Promise<EventsPageData> => {
  const key = `${clientId}:${committeeId}`;
  const inflight = eventsPageInflight.get(key);
  if (inflight) return inflight;

  const request = invokeCommittee<{ committee: any; events: any[]; members: any[] }>(
    'get_events_page_data',
    { client_id: clientId, committee_id: committeeId },
  ).then((data) => ({
    committee: data.committee ?? null,
    events: data.events || [],
    members: data.members || [],
  })).finally(() => eventsPageInflight.delete(key));

  eventsPageInflight.set(key, request);
  return request;
};

export const fetchCommitteeEventById = async (
  eventId: string,
  clientId: string
): Promise<CommitteeEvent | null> =>
  invokeCommittee<CommitteeEvent>('get_event', { client_id: clientId, event_id: eventId });

export const deleteCommitteeEvent = async (
  eventId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> =>
  invokeCommittee('delete_event', { client_id: clientId, event_id: eventId, employee_id: employeeId || null });

export const deleteCommitteeEventAttachment = async (
  attachmentId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> =>
  invokeCommittee('delete_event_attachment', {
    client_id: clientId,
    attachment_id: attachmentId,
    employee_id: employeeId || null,
  });

export const deleteCommitteeAttachment = async (
  attachmentId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> =>
  invokeCommittee('delete_committee_attachment', {
    client_id: clientId,
    attachment_id: attachmentId,
    employee_id: employeeId || null,
  });

export const fetchCommitteeMembers = async (
  committeeId: string,
  clientId: string
): Promise<CommitteeMember[]> =>
  invokeCommittee<CommitteeMember[]>('get_committee_members', { client_id: clientId, committee_id: committeeId });

// Fetch all members for every committee in one request — use on list pages instead of per-row fetches.
const allMembersInflight = new Map<string, Promise<CommitteeMember[]>>();

export const fetchAllCommitteeMembers = async (clientId: string): Promise<CommitteeMember[]> => {
  const inflight = allMembersInflight.get(clientId);
  if (inflight) return inflight;

  const request = invokeCommittee<CommitteeMember[]>('get_all_committee_members', { client_id: clientId })
    .finally(() => allMembersInflight.delete(clientId));

  allMembersInflight.set(clientId, request);
  return request;
};

export interface CommitteeFormData {
  employees: { id: string; name: string }[];
  memberRoles: CommitteeMemberRole[];
}

let formDataCache: CommitteeFormData | null = null;
let formDataInflight: Promise<CommitteeFormData> | null = null;

// Fetches employees + member roles from the edge function in one call.
// Cached after first load — call once on page init, no need to re-fetch on dialog open.
export const fetchCommitteeFormData = async (clientId: string): Promise<CommitteeFormData> => {
  if (formDataCache) return formDataCache;
  if (formDataInflight) return formDataInflight;

  formDataInflight = invokeCommittee<{ employees: { id: string; name: string }[]; member_roles: CommitteeMemberRole[] }>(
    'get_form_data',
    { client_id: clientId },
  ).then((data) => {
    formDataCache = { employees: data.employees || [], memberRoles: data.member_roles || [] };
    return formDataCache;
  }).finally(() => { formDataInflight = null; });

  return formDataInflight;
};

export const clearCommitteeFormDataCache = () => { formDataCache = null; };
