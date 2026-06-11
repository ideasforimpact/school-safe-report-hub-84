import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const body = await req.json();
    const action = body?.action;
    const clientId = body?.client_id || null;

    if (!action) {
      return json({ error: 'Missing action' }, 400);
    }

    if (clientId) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
      if (!ipValidation.allowed) {
        return json(
          {
            error: 'IP_NOT_WHITELISTED',
            message: 'Access denied. Your IP address is not whitelisted for this client.',
          },
          403
        );
      }
    }

    switch (action) {
      case 'list_committees':
        return json(await listCommittees(supabase, body.client_id));
      case 'get_committee':
        return json(await getCommittee(supabase, body.client_id, body.committee_id));
      case 'create_committee':
        return json(await createCommittee(supabase, body));
      case 'update_committee':
        return json(await updateCommittee(supabase, body));
      case 'delete_committee':
        return json(await deleteCommittee(supabase, body.client_id, body.committee_id, body.employee_id));
      case 'delete_committee_attachment':
        return json(
          await deleteCommitteeAttachment(supabase, body.client_id, body.attachment_id, body.employee_id)
        );
      case 'get_committee_members':
        return json(await getCommitteeMembers(supabase, body.client_id, body.committee_id));
      case 'list_events':
        return json(await listEvents(supabase, body.client_id, body.committee_id));
      case 'get_event':
        return json(await getEvent(supabase, body.client_id, body.event_id));
      case 'create_event':
        return json(await createEvent(supabase, body));
      case 'update_event':
        return json(await updateEvent(supabase, body));
      case 'delete_event':
        return json(await deleteEvent(supabase, body.client_id, body.event_id, body.employee_id));
      case 'delete_event_attachment':
        return json(await deleteEventAttachment(supabase, body.client_id, body.attachment_id, body.employee_id));
      default:
        return json({ error: `Unsupported action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('committee-management error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getEmployeeRecord(supabase: any, clientId: string, employeeId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, is_super_admin')
    .eq('id', employeeId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function isCommitteeMember(supabase: any, clientId: string, committeeId: string, employeeId: string) {
  const { data, error } = await supabase
    .from('committee_members')
    .select('id')
    .eq('client_id', clientId)
    .eq('committee_id', committeeId)
    .eq('employee_id', employeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

async function assertAdminAccess(supabase: any, clientId: string, employeeId?: string | null) {
  if (!employeeId) throw new Error('employee_id is required');
  const employee = await getEmployeeRecord(supabase, clientId, employeeId);
  if (!employee) throw new Error('Invalid employee context');
  if (!employee.is_super_admin) {
    throw new Error('Only admin users can perform this action');
  }
}

async function assertCommitteeMemberOrAdminAccess(
  supabase: any,
  clientId: string,
  committeeId: string,
  employeeId?: string | null
) {
  if (!employeeId) throw new Error('employee_id is required');
  const employee = await getEmployeeRecord(supabase, clientId, employeeId);
  if (!employee) throw new Error('Invalid employee context');
  if (employee.is_super_admin) return;

  const member = await isCommitteeMember(supabase, clientId, committeeId, employeeId);
  if (!member) {
    throw new Error('Only committee members or admin users can perform this action');
  }
}

async function writeCommitteeAuditLog(
  supabase: any,
  payload: {
    clientId: string;
    committeeId?: string | null;
    eventId?: string | null;
    employeeId?: string | null;
    actionType: string;
    details?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from('committee_audit_log').insert({
    client_id: payload.clientId,
    committee_id: payload.committeeId || null,
    event_id: payload.eventId || null,
    changed_by: payload.employeeId || null,
    action_type: payload.actionType,
    details: payload.details || {},
  });
  if (error) throw new Error(error.message);
}

async function assertCommitteeNameUnique(
  supabase: any,
  clientId: string,
  name: string,
  excludeCommitteeId?: string
) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw new Error('Committee name is required');
  }

  let query = supabase
    .from('committees')
    .select('id')
    .eq('client_id', clientId)
    .ilike('name', normalizedName)
    .limit(1);

  if (excludeCommitteeId) {
    query = query.neq('id', excludeCommitteeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    throw new Error('Committee name already exists');
  }
}

function getCommitteeNameConflictError(error: any): Error {
  const message = String(error?.message || '');
  const detail = String(error?.details || '');
  const hint = String(error?.hint || '');
  const combined = `${message} ${detail} ${hint}`.toLowerCase();
  if (
    combined.includes('committees_client_name_unique_idx') ||
    (combined.includes('duplicate key') && combined.includes('committees'))
  ) {
    return new Error('Committee name already exists');
  }
  return new Error(message || 'Failed to save committee');
}

async function listCommittees(supabase: any, clientId: string) {
  const { data: committees, error } = await supabase
    .from('committees')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const committeeIds = (committees || []).map((c: any) => c.id);
  const { data: membersData } = committeeIds.length
    ? await supabase.from('committee_members').select('committee_id').in('committee_id', committeeIds)
    : { data: [] };

  const memberCountByCommittee = new Map<string, number>();
  (membersData || []).forEach((row: any) => {
    memberCountByCommittee.set(row.committee_id, (memberCountByCommittee.get(row.committee_id) || 0) + 1);
  });

  return (committees || []).map((committee: any) => ({
    ...committee,
    member_count: memberCountByCommittee.get(committee.id) || 0,
  }));
}

async function getCommittee(supabase: any, clientId: string, committeeId: string) {
  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .eq('id', committeeId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const attachments = await getCommitteeAttachments(supabase, clientId, committeeId);
  return {
    ...data,
    attachments,
  };
}

async function createCommittee(supabase: any, payload: any) {
  const { client_id, employee_id, name, description, status, members, attachments } = payload;
  if (!client_id || !name) throw new Error('client_id and name are required');
  await assertAdminAccess(supabase, client_id, employee_id);
  await assertCommitteeNameUnique(supabase, client_id, name);
  const chairpersonEmployeeId = findChairpersonEmployeeId(members || []);

  const { data, error } = await supabase
    .from('committees')
    .insert({
      client_id,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      status: status ?? true,
      created_by: employee_id || null,
      updated_by: employee_id || null,
      chairperson_employee_id: chairpersonEmployeeId,
    })
    .select('*')
    .single();
  if (error) throw getCommitteeNameConflictError(error);

  try {
    await syncCommitteeMembers(supabase, client_id, data.id, members || [], employee_id);
    if (attachments && attachments.length > 0) {
      await uploadCommitteeAttachments(supabase, client_id, data.id, attachments);
    }
  } catch (err) {
    const { error: delErr } = await supabase
      .from('committees')
      .delete()
      .eq('id', data.id)
      .eq('client_id', client_id);
    if (delErr) console.error('Rollback failed after committee create error:', delErr);
    throw err;
  }

  await writeCommitteeAuditLog(supabase, {
    clientId: client_id,
    committeeId: data.id,
    employeeId: employee_id,
    actionType: 'committee_created',
    details: {
      name: data.name,
      status: data.status,
      chairperson_employee_id: chairpersonEmployeeId,
    },
  });
  const created = await getCommittee(supabase, client_id, data.id);
  return created;
}

async function updateCommittee(supabase: any, payload: any) {
  const { client_id, employee_id, committee_id, name, description, status, members, attachments } = payload;
  if (!client_id || !committee_id || !name) throw new Error('client_id, committee_id and name are required');
  await assertAdminAccess(supabase, client_id, employee_id);
  await assertCommitteeNameUnique(supabase, client_id, name, committee_id);
  const chairpersonEmployeeId = findChairpersonEmployeeId(members || []);

  const { data, error } = await supabase
    .from('committees')
    .update({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      status: status ?? true,
      updated_by: employee_id || null,
      chairperson_employee_id: chairpersonEmployeeId,
    })
    .eq('id', committee_id)
    .eq('client_id', client_id)
    .select('*')
    .single();
  if (error) throw getCommitteeNameConflictError(error);

  await syncCommitteeMembers(supabase, client_id, committee_id, members || [], employee_id);
  if (attachments && attachments.length > 0) {
    await uploadCommitteeAttachments(supabase, client_id, committee_id, attachments);
  }
  await writeCommitteeAuditLog(supabase, {
    clientId: client_id,
    committeeId: committee_id,
    employeeId: employee_id,
    actionType: 'committee_updated',
    details: {
      name: data.name,
      status: data.status,
      chairperson_employee_id: chairpersonEmployeeId,
    },
  });
  const updated = await getCommittee(supabase, client_id, committee_id);
  return updated;
}

async function deleteCommittee(supabase: any, clientId: string, committeeId: string, employeeId?: string | null) {
  await assertAdminAccess(supabase, clientId, employeeId);
  const { data: committeeRow } = await supabase
    .from('committees')
    .select('id, name')
    .eq('id', committeeId)
    .eq('client_id', clientId)
    .maybeSingle();
  const { error } = await supabase
    .from('committees')
    .delete()
    .eq('id', committeeId)
    .eq('client_id', clientId);
  if (error) throw new Error(error.message);
  await writeCommitteeAuditLog(supabase, {
    clientId,
    employeeId,
    actionType: 'committee_deleted',
    details: {
      deleted_committee_id: committeeId,
      deleted_committee_name: committeeRow?.name || null,
    },
  });
  return { success: true };
}

async function deleteCommitteeAttachment(
  supabase: any,
  clientId: string,
  attachmentId: string,
  employeeId?: string | null
) {
  await assertAdminAccess(supabase, clientId, employeeId);
  const { data, error } = await supabase
    .from('committee_attachments')
    .select('id, committee_id, storage_bucket, storage_path')
    .eq('id', attachmentId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { success: true };

  await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  const { error: deleteError } = await supabase
    .from('committee_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('client_id', clientId);
  if (deleteError) throw new Error(deleteError.message);

  await writeCommitteeAuditLog(supabase, {
    clientId,
    committeeId: data.committee_id,
    employeeId,
    actionType: 'committee_attachment_deleted',
    details: { attachment_id: attachmentId },
  });
  return { success: true };
}

function normalizeRole(role: string | null | undefined): string {
  return String(role || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function findChairpersonEmployeeId(
  members: Array<{ employeeId: string; role: string }>
): string | null {
  const chairperson = (members || []).find((member) => normalizeRole(member.role) === 'chairperson');
  return chairperson?.employeeId || null;
}

async function getCommitteeMembers(supabase: any, clientId: string, committeeId: string) {
  const { data, error } = await supabase
    .from('committee_members')
    .select('id, committee_id, client_id, employee_id, role')
    .eq('client_id', clientId)
    .eq('committee_id', committeeId);
  if (error) throw new Error(error.message);
  return data || [];
}

async function getCommitteeAttachments(supabase: any, clientId: string, committeeId: string) {
  const { data, error } = await supabase
    .from('committee_attachments')
    .select('id, committee_id, file_name, file_url, file_type, file_size, storage_bucket, storage_path')
    .eq('client_id', clientId)
    .eq('committee_id', committeeId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function createEvent(supabase: any, payload: any) {
  const {
    client_id,
    employee_id,
    committee_id,
    event_type,
    title,
    description,
    event_date,
    participant_ids,
    attachments,
  } = payload;
  await assertCommitteeMemberOrAdminAccess(supabase, client_id, committee_id, employee_id);

  const { data, error } = await supabase
    .from('committee_events')
    .insert({
      client_id,
      committee_id,
      event_type,
      title,
      description: description ? String(description).trim() : null,
      event_date,
      created_by: employee_id || null,
      updated_by: employee_id || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  try {
    await syncEventParticipants(supabase, client_id, data.id, participant_ids || []);
    if (attachments && attachments.length > 0) {
      await uploadEventAttachments(supabase, client_id, data.id, attachments);
    }
  } catch (err) {
    const { error: delErr } = await supabase
      .from('committee_events')
      .delete()
      .eq('id', data.id)
      .eq('client_id', client_id);
    if (delErr) console.error('Rollback failed after event create error:', delErr);
    throw err;
  }

  await writeCommitteeAuditLog(supabase, {
    clientId: client_id,
    committeeId: committee_id,
    eventId: data.id,
    employeeId: employee_id,
    actionType: event_type === 'mom' ? 'mom_submitted' : 'event_submitted',
    details: {
      title: data.title,
      event_date: data.event_date,
      participant_count: (participant_ids || []).length,
      attachment_count: (attachments || []).length,
    },
  });

  return await getEvent(supabase, client_id, data.id);
}

async function updateEvent(supabase: any, payload: any) {
  const {
    client_id,
    employee_id,
    event_id,
    event_type,
    title,
    description,
    event_date,
    participant_ids,
    attachments,
  } = payload;
  await assertAdminAccess(supabase, client_id, employee_id);

  const { error } = await supabase
    .from('committee_events')
    .update({
      event_type,
      title,
      description: description ? String(description).trim() : null,
      event_date,
      updated_by: employee_id || null,
    })
    .eq('id', event_id)
    .eq('client_id', client_id);
  if (error) throw new Error(error.message);

  await syncEventParticipants(supabase, client_id, event_id, participant_ids || []);
  if (attachments && attachments.length > 0) {
    await uploadEventAttachments(supabase, client_id, event_id, attachments);
  }
  await writeCommitteeAuditLog(supabase, {
    clientId: client_id,
    eventId: event_id,
    employeeId: employee_id,
    actionType: 'event_updated',
    details: {
      event_type,
      title,
      event_date,
      participant_count: (participant_ids || []).length,
      added_attachment_count: (attachments || []).length,
    },
  });

  return await getEvent(supabase, client_id, event_id);
}

async function listEvents(supabase: any, clientId: string, committeeId: string) {
  const { data, error } = await supabase
    .from('committee_events')
    .select('*')
    .eq('client_id', clientId)
    .eq('committee_id', committeeId)
    .order('event_date', { ascending: false });
  if (error) throw new Error(error.message);
  return await hydrateEvents(supabase, clientId, data || []);
}

async function getEvent(supabase: any, clientId: string, eventId: string) {
  const { data, error } = await supabase
    .from('committee_events')
    .select('*')
    .eq('client_id', clientId)
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const hydrated = await hydrateEvents(supabase, clientId, [data]);
  return hydrated[0] || null;
}

async function deleteEvent(supabase: any, clientId: string, eventId: string, employeeId?: string | null) {
  await assertAdminAccess(supabase, clientId, employeeId);
  const { data: eventRow } = await supabase
    .from('committee_events')
    .select('id, committee_id, event_type, title, event_date')
    .eq('client_id', clientId)
    .eq('id', eventId)
    .maybeSingle();
  const { data: attachments } = await supabase
    .from('committee_event_attachments')
    .select('storage_bucket, storage_path')
    .eq('client_id', clientId)
    .eq('event_id', eventId);

  for (const file of attachments || []) {
    await supabase.storage.from(file.storage_bucket).remove([file.storage_path]);
  }

  const { error } = await supabase
    .from('committee_events')
    .delete()
    .eq('client_id', clientId)
    .eq('id', eventId);
  if (error) throw new Error(error.message);
  await writeCommitteeAuditLog(supabase, {
    clientId,
    committeeId: eventRow?.committee_id || null,
    employeeId,
    actionType: 'event_deleted',
    details: {
      deleted_event_id: eventId,
      event_type: eventRow?.event_type || null,
      title: eventRow?.title || null,
      event_date: eventRow?.event_date || null,
      removed_attachment_count: (attachments || []).length,
    },
  });
  return { success: true };
}

async function deleteEventAttachment(
  supabase: any,
  clientId: string,
  attachmentId: string,
  employeeId?: string | null
) {
  await assertAdminAccess(supabase, clientId, employeeId);
  const { data, error } = await supabase
    .from('committee_event_attachments')
    .select('id, storage_bucket, storage_path')
    .eq('id', attachmentId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { success: true };

  await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  const { error: deleteError } = await supabase
    .from('committee_event_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('client_id', clientId);
  if (deleteError) throw new Error(deleteError.message);
  await writeCommitteeAuditLog(supabase, {
    clientId,
    employeeId,
    actionType: 'event_attachment_deleted',
    details: {
      attachment_id: attachmentId,
    },
  });
  return { success: true };
}

async function syncCommitteeMembers(
  supabase: any,
  clientId: string,
  committeeId: string,
  members: Array<{ employeeId: string; role: string }>,
  employeeId?: string | null
) {
  const normalized = (members || [])
    .filter((m) => m.employeeId && m.role)
    .map((m) => ({ employee_id: m.employeeId, role: String(m.role).trim() }));

  const targetByEmployee = new Map<string, string>();
  normalized.forEach((m) => {
    if (!targetByEmployee.has(m.employee_id)) targetByEmployee.set(m.employee_id, m.role);
  });
  const targetIds = Array.from(targetByEmployee.keys());

  const { data: existing } = await supabase
    .from('committee_members')
    .select('id, employee_id, role')
    .eq('client_id', clientId)
    .eq('committee_id', committeeId);

  const existingRows = existing || [];
  const existingIds = new Set(existingRows.map((r: any) => r.employee_id));
  const targetSet = new Set(targetIds);

  const removeIds = existingRows.filter((r: any) => !targetSet.has(r.employee_id)).map((r: any) => r.id);
  if (removeIds.length > 0) {
    const removedEmployeeIds = existingRows
      .filter((r: any) => !targetSet.has(r.employee_id))
      .map((r: any) => r.employee_id);
    await supabase.from('committee_members').delete().in('id', removeIds);
    for (const removedEmployeeId of removedEmployeeIds) {
      await writeCommitteeAuditLog(supabase, {
        clientId,
        committeeId,
        employeeId,
        actionType: 'member_removed',
        details: { member_employee_id: removedEmployeeId },
      });
    }
  }

  const inserts = targetIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({
      committee_id: committeeId,
      client_id: clientId,
      employee_id: id,
      role: targetByEmployee.get(id),
    }));
  if (inserts.length > 0) {
    await supabase.from('committee_members').insert(inserts);
    for (const inserted of inserts) {
      await writeCommitteeAuditLog(supabase, {
        clientId,
        committeeId,
        employeeId,
        actionType: 'member_added',
        details: {
          member_employee_id: inserted.employee_id,
          role: inserted.role,
        },
      });
    }
  }

  for (const row of existingRows) {
    if (!targetSet.has(row.employee_id)) continue;
    const nextRole = targetByEmployee.get(row.employee_id);
    await supabase
      .from('committee_members')
      .update({ role: nextRole })
      .eq('id', row.id);
    if (String(row.role || '') !== String(nextRole || '')) {
      await writeCommitteeAuditLog(supabase, {
        clientId,
        committeeId,
        employeeId,
        actionType: 'member_role_changed',
        details: {
          member_employee_id: row.employee_id,
          role: nextRole,
        },
      });
    }
  }
}

async function syncEventParticipants(
  supabase: any,
  clientId: string,
  eventId: string,
  participantIds: string[]
) {
  const targetIds = Array.from(new Set((participantIds || []).filter(Boolean)));

  const { data: existing } = await supabase
    .from('committee_event_participants')
    .select('id, employee_id')
    .eq('client_id', clientId)
    .eq('event_id', eventId);

  const existingRows = existing || [];
  const existingIds = new Set(existingRows.map((r: any) => r.employee_id));
  const targetSet = new Set(targetIds);

  const removeIds = existingRows.filter((r: any) => !targetSet.has(r.employee_id)).map((r: any) => r.id);
  if (removeIds.length > 0) {
    await supabase.from('committee_event_participants').delete().in('id', removeIds);
  }

  const inserts = targetIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ event_id: eventId, client_id: clientId, employee_id: id }));
  if (inserts.length > 0) {
    await supabase.from('committee_event_participants').insert(inserts);
  }
}

async function uploadEventAttachments(
  supabase: any,
  clientId: string,
  eventId: string,
  files: Array<{ name: string; type: string; size: number; base64: string }>
) {
  const rows: any[] = [];
  for (const file of files) {
    if (!file.base64) continue;
    const blob = base64ToBlob(file.base64, file.type || 'application/octet-stream');
    const safeName = sanitizeStorageFileName(file.name || 'file');
    const path = `${clientId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error } = await supabase.storage
      .from('committee-event-attachments')
      .upload(path, blob, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('committee-event-attachments').getPublicUrl(path);
    rows.push({
      event_id: eventId,
      client_id: clientId,
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size || 0,
      storage_bucket: 'committee-event-attachments',
      storage_path: path,
      file_url: data.publicUrl,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('committee_event_attachments').insert(rows);
    if (error) throw new Error(error.message);
  }
}

async function uploadCommitteeAttachments(
  supabase: any,
  clientId: string,
  committeeId: string,
  files: Array<{ name: string; type: string; size: number; base64: string }>
) {
  const rows: any[] = [];
  for (const file of files) {
    if (!file.base64) continue;
    const blob = base64ToBlob(file.base64, file.type || 'application/octet-stream');
    const safeName = sanitizeStorageFileName(file.name || 'file');
    const path = `${clientId}/${committeeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error } = await supabase.storage
      .from('committee-attachments')
      .upload(path, blob, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('committee-attachments').getPublicUrl(path);
    rows.push({
      committee_id: committeeId,
      client_id: clientId,
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size || 0,
      storage_bucket: 'committee-attachments',
      storage_path: path,
      file_url: data.publicUrl,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('committee_attachments').insert(rows);
    if (error) throw new Error(error.message);
  }
}

async function hydrateEvents(supabase: any, clientId: string, events: any[]) {
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) return events;

  const { data: participants } = await supabase
    .from('committee_event_participants')
    .select('event_id, employee_id')
    .eq('client_id', clientId)
    .in('event_id', eventIds);

  const { data: attachments } = await supabase
    .from('committee_event_attachments')
    .select('id, event_id, file_name, file_url, file_type, file_size, storage_bucket, storage_path')
    .eq('client_id', clientId)
    .in('event_id', eventIds);

  const employeeIds = Array.from(
    new Set([
      ...(participants || []).map((p: any) => p.employee_id),
      ...events.map((e) => e.created_by).filter(Boolean),
    ])
  );
  const { data: employees } = employeeIds.length
    ? await supabase.from('employees').select('id, first_name, last_name').in('id', employeeIds)
    : { data: [] };

  const employeeName = new Map<string, string>();
  (employees || []).forEach((emp: any) => {
    employeeName.set(emp.id, `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown Employee');
  });

  const participantsMap = new Map<string, string[]>();
  (participants || []).forEach((p: any) => {
    const arr = participantsMap.get(p.event_id) || [];
    arr.push(p.employee_id);
    participantsMap.set(p.event_id, arr);
  });

  const attachmentsMap = new Map<string, any[]>();
  (attachments || []).forEach((a: any) => {
    const arr = attachmentsMap.get(a.event_id) || [];
    arr.push(a);
    attachmentsMap.set(a.event_id, arr);
  });

  return events.map((event) => {
    const participantIds = participantsMap.get(event.id) || [];
    return {
      ...event,
      participants: participantIds,
      participant_names: participantIds.map((id) => employeeName.get(id) || 'Unknown Employee'),
      created_by_name: event.created_by ? employeeName.get(event.created_by) || null : null,
      attachments: attachmentsMap.get(event.id) || [],
    };
  });
}

/** Storage object keys must not contain characters Supabase rejects (e.g. []()). Original file.name is still stored on the row. */
function sanitizeStorageFileName(originalName: string): string {
  const trimmed = String(originalName || '').trim() || 'file';
  const lastDot = trimmed.lastIndexOf('.');
  const hasExt = lastDot > 0 && lastDot < trimmed.length - 1;
  const extRaw = hasExt ? trimmed.slice(lastDot + 1) : '';
  const ext = extRaw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toLowerCase();
  const base = hasExt ? trimmed.slice(0, lastDot) : trimmed;
  let safeBase = base
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!safeBase) safeBase = 'file';
  return ext ? `${safeBase}.${ext}` : safeBase;
}

function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}
