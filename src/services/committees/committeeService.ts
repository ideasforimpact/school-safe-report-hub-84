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

export const fetchCommittees = async (clientId: string): Promise<Committee[]> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'list_committees', client_id: clientId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch committees');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return (data || []) as Committee[];
};

export const fetchCommitteeById = async (
  committeeId: string,
  clientId: string
): Promise<Committee | null> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'get_committee', client_id: clientId, committee_id: committeeId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch committee');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return (data as Committee) || null;
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

export const createCommittee = async (payload: CommitteePayload): Promise<Committee> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'create_committee',
      client_id: payload.clientId,
      employee_id: payload.employeeId || null,
      name: payload.name,
      description: payload.description || null,
      status: payload.status ?? true,
      members: payload.members || [],
      attachments: payload.attachments || [],
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create committee');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as Committee;
};

export const updateCommittee = async (
  committeeId: string,
  payload: CommitteePayload
): Promise<Committee> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'update_committee',
      client_id: payload.clientId,
      employee_id: payload.employeeId || null,
      committee_id: committeeId,
      name: payload.name,
      description: payload.description || null,
      status: payload.status ?? true,
      members: payload.members || [],
      attachments: payload.attachments || [],
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to update committee');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as Committee;
};

export const deleteCommittee = async (
  committeeId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'delete_committee',
      client_id: clientId,
      committee_id: committeeId,
      employee_id: employeeId || null,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete committee');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
};

export const createCommitteeEvent = async (
  payload: CommitteeEventPayload
): Promise<CommitteeEvent> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'create_event',
      client_id: payload.clientId,
      employee_id: payload.employeeId || null,
      committee_id: payload.committeeId,
      event_type: payload.eventType,
      title: payload.title,
      description: payload.description || null,
      event_date: payload.eventDate,
      participant_ids: payload.participantIds || [],
      attachments: payload.attachments || [],
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create MOM/Event');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as CommitteeEvent;
};

export const updateCommitteeEvent = async (
  payload: CommitteeEventPayload
): Promise<CommitteeEvent> => {
  if (!payload.eventId) {
    throw new Error('Event ID is required');
  }
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'update_event',
      client_id: payload.clientId,
      employee_id: payload.employeeId || null,
      event_id: payload.eventId,
      event_type: payload.eventType,
      title: payload.title,
      description: payload.description || null,
      event_date: payload.eventDate,
      participant_ids: payload.participantIds || [],
      attachments: payload.attachments || [],
    },
  });
  if (error) {
    throw new Error(error.message || 'Failed to update MOM/Event');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as CommitteeEvent;
};

export const fetchCommitteeEvents = async (
  committeeId: string,
  clientId: string
): Promise<CommitteeEvent[]> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'list_events', client_id: clientId, committee_id: committeeId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch MOM/Event list');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return (data || []) as CommitteeEvent[];
};

export const fetchCommitteeEventById = async (
  eventId: string,
  clientId: string
): Promise<CommitteeEvent | null> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'get_event', client_id: clientId, event_id: eventId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch MOM/Event');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return (data as CommitteeEvent) || null;
};

export const deleteCommitteeEvent = async (
  eventId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'delete_event', client_id: clientId, event_id: eventId, employee_id: employeeId || null },
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete MOM/Event');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
};

export const deleteCommitteeEventAttachment = async (
  attachmentId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'delete_event_attachment',
      client_id: clientId,
      attachment_id: attachmentId,
      employee_id: employeeId || null,
    },
  });
  if (error) {
    throw new Error(error.message || 'Failed to delete attachment');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
};

export const deleteCommitteeAttachment = async (
  attachmentId: string,
  clientId: string,
  employeeId?: string | null
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: {
      action: 'delete_committee_attachment',
      client_id: clientId,
      attachment_id: attachmentId,
      employee_id: employeeId || null,
    },
  });
  if (error) {
    throw new Error(error.message || 'Failed to delete committee attachment');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
};

export const fetchCommitteeMembers = async (
  committeeId: string,
  clientId: string
): Promise<CommitteeMember[]> => {
  const { data, error } = await supabase.functions.invoke('committee-management', {
    body: { action: 'get_committee_members', client_id: clientId, committee_id: committeeId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch committee members');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return (data || []) as CommitteeMember[];
};
