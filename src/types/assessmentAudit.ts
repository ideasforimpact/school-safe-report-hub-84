export interface AssessmentAuditLogEntry {
  id: string;
  assessment_id: string;
  client_id: string | null;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  change_type: 'creation' | 'assignment' | 'status_change' | 'completion' | 'closure' | 'rework' | 'score_update' | 'date_update' | 'name_update' | 'description_update' | 'field_update';
  description: string | null;
  metadata: Record<string, any>;
}

export interface AssessmentAuditLogEntryWithUser extends AssessmentAuditLogEntry {
  changed_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}