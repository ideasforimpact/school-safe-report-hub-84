import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  incident_id: string;
  client_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  change_type: string;
  description: string | null;
  changes: any[] | null;
  created_at: string;
}

export interface FormattedAuditEntry {
  id: string;
  type: 'incident' | 'action' | 'status' | 'comment' | 'actionItem';
  activity: 'create' | 'update' | 'delete' | 'close' | 'reopen' | 'void';
  entityId: string;
  entityTitle: string;
  user: string;
  userId: string;
  date: Date;
  details?: string;
  changes?: any[];
}

// Fetch audit log entries for a specific incident with client filtering
export const fetchIncidentAuditLog = async (incidentId: string): Promise<AuditLogEntry[]> => {
  try {
    // First get the current user's employee record to get client_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employee) {
      throw new Error('Employee not found');
    }

    const { data, error } = await supabase
      .from('incident_audit_log')
      .select(`
        id,
        incident_id,
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
      `)
      .eq('incident_id', incidentId)
      .eq('client_id', employee.client_id)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit log:', error);
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    // Transform the data to ensure proper types
    const transformedData: AuditLogEntry[] = (data || []).map(entry => ({
      id: entry.id,
      incident_id: entry.incident_id,
      client_id: entry.client_id,
      field_changed: entry.field_changed,
      old_value: entry.old_value,
      new_value: entry.new_value,
      changed_by: entry.changed_by,
      changed_at: entry.changed_at,
      change_type: entry.change_type,
      description: entry.description,
      changes: Array.isArray(entry.changes) ? entry.changes : 
               (entry.changes ? [entry.changes] : null),
      created_at: entry.created_at
    }));

    return transformedData;
  } catch (error) {
    console.error('Error in fetchIncidentAuditLog:', error);
    throw error;
  }
};

// Helper function to get user name from employee data
const getUserName = async (userId: string): Promise<string> => {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (error || !employee) {
      return 'Unknown User';
    }

    return `${employee.first_name} ${employee.last_name}`;
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
};

// Helper function to format field names for display
const formatFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    'status_id': 'Status',
    'assigned_to': 'Assignee',
    'priority_id': 'Priority',
    'category_id': 'Category',
    'subcategory_id': 'Subcategory',
    'location_id': 'Location',
    'facility_id': 'Facility',
    'type_id': 'Type',
    'description': 'Description',
    'root_cause_analysis': 'Root Cause Analysis',
    'action_taken': 'Action Taken',
    'comments': 'Comments',
    'documents': 'Documents',
    'multiple_fields': 'Multiple Fields'
  };

  return fieldMap[fieldName] || fieldName;
};

// Convert raw audit log entries to formatted activities
export const formatAuditLogEntries = async (entries: AuditLogEntry[]): Promise<FormattedAuditEntry[]> => {
  const formattedEntries: FormattedAuditEntry[] = [];

  for (const entry of entries) {
    try {
      const userName = await getUserName(entry.changed_by);
      
      // Determine activity type based on field and change type
      let activityType: FormattedAuditEntry['activity'] = 'update';
      let entityType: FormattedAuditEntry['type'] = 'incident';
      
      if (entry.change_type === 'field_update') {
        if (entry.field_changed === 'status_id' && entry.changes) {
          // Check changes array for status updates
          const statusChange = entry.changes.find((change: any) => change.field === 'status_id');
          if (statusChange) {
            entityType = 'status';
            if (statusChange.new_value === 'closed') {
              activityType = 'close';
            } else if (statusChange.old_value === 'closed') {
              activityType = 'reopen';
            }
          }
        }
      } else if (entry.change_type === 'action') {
        entityType = 'action';
        activityType = 'create';
      } else if (entry.change_type === 'comment') {
        entityType = 'comment';
        activityType = 'create';
      }

      // Create description from changes if available
      let details = entry.description;
      if (!details && entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
        if (entry.changes.length === 1) {
          const change = entry.changes[0];
          details = change.description || `${formatFieldName(change.field)} updated`;
        } else {
          details = `Updated ${entry.changes.length} fields: ${entry.changes.map((c: any) => formatFieldName(c.field)).join(', ')}`;
        }
      } else if (!details && entry.change_type === 'field_update') {
        const fieldName = formatFieldName(entry.field_changed);
        if (entry.old_value && entry.new_value) {
          details = `${fieldName} changed from "${entry.old_value}" to "${entry.new_value}"`;
        } else if (entry.new_value) {
          details = `${fieldName} set to "${entry.new_value}"`;
        } else if (entry.old_value) {
          details = `${fieldName} removed (was "${entry.old_value}")`;
        } else {
          details = `${fieldName} updated`;
        }
      }

      formattedEntries.push({
        id: entry.id,
        type: entityType,
        activity: activityType,
        entityId: entry.incident_id,
        entityTitle: formatFieldName(entry.field_changed),
        user: userName,
        userId: entry.changed_by,
        date: new Date(entry.changed_at),
        details: details || undefined,
        changes: entry.changes || undefined
      });
    } catch (error) {
      console.error('Error formatting audit entry:', error);
      // Continue with next entry instead of failing completely
    }
  }

  return formattedEntries;
};

// Log a manual audit entry (for comments, documents, etc.)
export const logAuditEntry = async (
  incidentId: string,
  fieldChanged: string,
  changedBy: string,
  oldValue?: string,
  newValue?: string,
  changeType: string = 'action',
  description?: string,
  changes?: any[]
): Promise<string | null> => {
  try {
    // Get client_id from the current user's employee record
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employee) {
      throw new Error('Employee not found');
    }

    const { data, error } = await supabase.rpc('insert_incident_audit_log', {
      p_incident_id: incidentId,
      p_client_id: employee.client_id,
      p_field_changed: fieldChanged,
      p_changed_by: changedBy,
      p_old_value: oldValue || null,
      p_new_value: newValue || null,
      p_change_type: changeType,
      p_description: description || null,
      p_changes: changes ? JSON.stringify(changes) : null
    });

    if (error) {
      console.error('Error logging audit entry:', error);
      throw new Error(`Failed to log audit entry: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in logAuditEntry:', error);
    throw error;
  }
};
