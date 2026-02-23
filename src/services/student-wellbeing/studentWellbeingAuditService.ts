import { supabase } from '@/integrations/supabase/client';

export interface StudentWellbeingAuditEntry {
  id: string;
  wellbeing_id: string;
  client_id: string | null;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  change_type: string;
  description: string | null;
  changes: any[] | null;
  created_at: string;
}

export interface FormattedStudentWellbeingAuditEntry {
  id: string;
  date: Date;
  userId: string | null;
  userName: string;
  /** Short label for the badge, e.g. "Status Changed" */
  badgeLabel: string;
  /** Tailwind classes for badge styling */
  badgeClass: string;
  /** Relative time text, e.g. "less than a minute ago" */
  relativeTime: string;
  /** Title text row under the badge, e.g. "Record updated" */
  title: string;
  /** Main description line, e.g. "Status changed from Open to Closed" */
  details: string;
  /** Optional explicit from/to values for display blocks */
  fromLabel?: string;
  toLabel?: string;
}

export const fetchStudentWellbeingAuditLog = async (
  wellbeingId: string
): Promise<StudentWellbeingAuditEntry[]> => {
  const { data, error } = await (supabase as any)
    // Cast to any because this table is not yet in the generated Supabase types
    .from('student_wellbeing_audit_log')
    .select(
      `
      id,
      wellbeing_id,
      client_id,
      field_changed,
      old_value,
      new_value,
      changed_by,
      changed_at,
      change_type,
      description,
      changes,
      created_at
    `
    )
    .eq('wellbeing_id', wellbeingId)
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch student wellbeing audit log:', error);
    throw new Error(error.message || 'Failed to fetch audit trail');
  }

  return (data ?? []) as unknown as StudentWellbeingAuditEntry[];
};

const getEmployeeName = async (employeeId: string | null): Promise<string> => {
  if (!employeeId) return 'Unknown User';
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .eq('id', employeeId)
      .single();

    if (error || !data) {
      return 'Unknown User';
    }

    return `${data.first_name} ${data.last_name}`;
  } catch (err) {
    console.error('Error looking up employee name for audit log:', err);
    return 'Unknown User';
  }
};

const formatFieldLabel = (field: string): string => {
  const map: Record<string, string> = {
    student_id: 'Student',
    section_id: 'Section',
    grade_id: 'Grade',
    type_of_concern_id: 'Type of Concern',
    date_of_observation: 'Date of Observation',
    concern: 'Concern',
    status: 'Status',
    next_follow_up: 'Next Follow-up',
    document_url: 'Attachments',
    record: 'Record',
    multiple_fields: 'Multiple Fields',
  };
  return map[field] ?? field;
};

// Cache for type of concern names to avoid repeated lookups
const typeOfConcernNameCache = new Map<string, string>();

const resolveTypeOfConcernName = async (id: string | null): Promise<string | null> => {
  if (!id) return null;
  const cached = typeOfConcernNameCache.get(id);
  if (cached) return cached;
  try {
    const { data, error } = await (supabase as any)
      .from('general_concern')
      .select('name')
      .eq('id', id)
      .single();
    if (error || !data?.name) return id;
    typeOfConcernNameCache.set(id, data.name);
    return data.name as string;
  } catch {
    return id;
  }
};

const formatAuditDate = (isoOrNull: string | null | undefined): string => {
  if (isoOrNull == null || isoOrNull === '') return '';
  try {
    const d = new Date(isoOrNull);
    if (Number.isNaN(d.getTime())) return isoOrNull;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return isoOrNull;
  }
};

const formatStatusForAudit = (v: string): string => {
  if (!v || v === '') return 'Not set';
  return v
    .toString()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date().getTime();
  const diffMs = now - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return 'less than a minute ago';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffMonth = Math.round(diffDay / 30);
  return `about ${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
};

export const formatStudentWellbeingAuditEntries = async (
  entries: StudentWellbeingAuditEntry[]
): Promise<FormattedStudentWellbeingAuditEntry[]> => {
  const formatted: FormattedStudentWellbeingAuditEntry[] = [];

  for (const entry of entries) {
    const userName = await getEmployeeName(entry.changed_by);
    const date = new Date(entry.changed_at);

    let badgeLabel = 'Updated';
    let badgeClass = 'bg-gray-100 text-gray-800 border border-gray-200';
    if (entry.change_type === 'create') {
      badgeLabel = 'Created';
      badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else if (entry.change_type === 'delete') {
      badgeLabel = 'Deleted';
      badgeClass = 'bg-red-100 text-red-800 border border-red-200';
    }

    // Defaults – will be refined below
    let title = 'Record updated';
    // For field updates we intentionally ignore entry.description and build a human sentence,
    // similar to AssessmentAuditTimeline behaviour.
    let details = entry.change_type === 'field_update' ? '' : (entry.description ?? '');
    let fromLabel: string | undefined;
    let toLabel: string | undefined;

    // If we have a structured changes array, try to build richer text from it
    const changesArray = Array.isArray(entry.changes) ? entry.changes : null;

    if (entry.change_type === 'create') {
      title = 'Record created';
      details = 'Student well-being record created.';
    } else if (entry.change_type === 'delete') {
      title = 'Record deleted';
      details = 'Student well-being record deleted.';
    } else if (entry.change_type === 'status_change' || entry.field_changed === 'status') {
      badgeLabel = 'Status Changed';
      badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
      const fromPretty = formatStatusForAudit(entry.old_value ?? '');
      const toPretty = formatStatusForAudit(entry.new_value ?? '');
      title = 'Status updated';
      details = `Status changed from ${fromPretty} to ${toPretty}.`;
      fromLabel = fromPretty;
      toLabel = toPretty;
    } else if (entry.change_type === 'field_update') {
      const statusChange = changesArray?.find((c: any) => c.field === 'status');
      if (statusChange) {
        badgeLabel = 'Status Changed';
        badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
        const fromPretty = formatStatusForAudit(statusChange.old_value ?? '');
        const toPretty = formatStatusForAudit(statusChange.new_value ?? '');
        title = 'Status updated';
        details = `Status changed from ${fromPretty} to ${toPretty}.`;
        fromLabel = fromPretty;
        toLabel = toPretty;
      } else if (changesArray && changesArray.length > 0) {
        // Multiple field updates
        const fieldNames = changesArray.map((c: any) => formatFieldLabel(c.field));
        const primary = changesArray[0];
        const fieldLabel = formatFieldLabel(primary.field);
        let oldVal = primary.old_value ?? '';
        let newVal = primary.new_value ?? '';

        // Resolve concern type ids to names for readability
        if (primary.field === 'type_of_concern_id') {
          const resolvedOld = await resolveTypeOfConcernName(oldVal);
          const resolvedNew = await resolveTypeOfConcernName(newVal);
          oldVal = resolvedOld ?? oldVal;
          newVal = resolvedNew ?? newVal;
        }

        title = 'Record updated';
        fromLabel = oldVal || undefined;
        toLabel = newVal || undefined;
        if (!entry.description) {
          if (oldVal && newVal) {
            details = `${fieldLabel} changed from "${oldVal}" to "${newVal}".`;
          } else if (newVal) {
            details = `${fieldLabel} set to "${newVal}".`;
          } else if (oldVal) {
            details = `${fieldLabel} cleared (was "${oldVal}").`;
          } else {
            details = `Updated ${fieldNames.join(', ')}.`;
          }
        }
      } else if (!details) {
        // Fallback: single field row (field_changed, old_value, new_value)
        const fieldLabel = formatFieldLabel(entry.field_changed);
        let oldVal: string | null = entry.old_value ?? null;
        let newVal: string | null = entry.new_value ?? null;

        if (entry.field_changed === 'type_of_concern_id') {
          oldVal = await resolveTypeOfConcernName(oldVal);
          newVal = await resolveTypeOfConcernName(newVal);
        } else if (entry.field_changed === 'date_of_observation') {
          oldVal = formatAuditDate(oldVal) || oldVal;
          newVal = formatAuditDate(newVal) || newVal;
        }

        if (oldVal && newVal) {
          details = `${fieldLabel} changed from "${oldVal}" to "${newVal}".`;
          fromLabel = oldVal;
          toLabel = newVal;
        } else if (newVal) {
          details = `${fieldLabel} set to "${newVal}".`;
          fromLabel = oldVal ?? undefined;
          toLabel = newVal;
        } else if (oldVal) {
          details = `${fieldLabel} cleared (was "${oldVal}").`;
          fromLabel = oldVal;
        } else {
          details = `${fieldLabel} updated.`;
        }
      }
    }

    formatted.push({
      id: entry.id,
      date,
      userId: entry.changed_by,
      userName,
      badgeLabel,
      badgeClass,
      relativeTime: formatRelativeTime(date),
      title,
      details,
      fromLabel,
      toLabel,
    });
  }

  // newest first already, but ensure sorting by date just in case
  formatted.sort((a, b) => b.date.getTime() - a.date.getTime());
  return formatted;
};

