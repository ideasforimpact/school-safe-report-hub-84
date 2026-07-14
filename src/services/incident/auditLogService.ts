
import { supabase } from '@/integrations/supabase/client';
import { getActiveClientId } from '@/services/auth/getActiveClientId';

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
  changes: unknown[] | null;
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
  changes?: unknown[];
}

export interface AuditLogFetchResult {
  entries: AuditLogEntry[];
  // Pre-resolved by the edge function (one batched query per lookup type across
  // every entry) so formatAuditLogEntries below no longer does a direct DB call
  // per entry per changed field.
  userNames: Record<string, string>;
  fieldValues: Record<string, string>;
}

const auditLogInflight = new Map<string, Promise<AuditLogFetchResult>>();

// Fetch audit log entries for a specific incident (RLS handles client filtering automatically)
export const fetchIncidentAuditLog = async (incidentId: string): Promise<AuditLogFetchResult> => {
  try {
    console.log('=== AUDIT LOG SERVICE DEBUG ===');
    console.log('Fetching audit trail for incident:', incidentId);

    let request = auditLogInflight.get(incidentId);
    if (!request) {
      request = (async () => {
        const clientId = await getActiveClientId();
        const { data, error } = await supabase.functions.invoke('fetch-incidents', {
          body: { operation: 'get_audit_log', incidentId, clientId },
        });

        if (error) throw error;
        if (!data?.success) throw new Error('Failed to fetch audit log');

        return {
          entries: (data.data || []) as unknown[],
          userNames: (data.userNames || {}) as Record<string, string>,
          fieldValues: (data.fieldValues || {}) as Record<string, string>,
        };
      })();

      auditLogInflight.set(incidentId, request);
      request.finally(() => auditLogInflight.delete(incidentId));
    }

    const { entries: data, userNames, fieldValues } = await request;

    console.log('Audit entries found:', data?.length || 0);
    console.log('Audit entries:', data);
    console.log('=== END AUDIT LOG SERVICE DEBUG ===');

    // Transform the data to ensure proper types
    const transformedData: AuditLogEntry[] = (data as AuditLogEntry[] || []).map(entry => ({
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

    return { entries: transformedData, userNames, fieldValues };
  } catch (error) {
    console.error('Error in fetchIncidentAuditLog:', error);
    throw error;
  }
};

// Looks up the display name from the userNames map the edge function already
// batch-resolved for every entry on this page (see get_audit_log in
// fetch-incidents) — was previously a per-entry direct `employees` query.
const getUserName = (userId: string, userNames: Record<string, string>): string => {
  return userNames[userId] || 'Unknown User';
};

// DB-backed lookup fields — resolved via the fieldValues map the edge function
// already batch-fetched (one query per field type across every entry, instead
// of one query per entry per field). Everything else (people_involved,
// documents, date) is pure formatting with no DB dependency, unchanged below.
const DB_LOOKUP_FIELDS = new Set([
  'status_id', 'priority_id', 'category_id', 'subcategory_id', 'type_id', 'assigned_to', 'facility_id',
]);

// Helper function to resolve field values to human-readable names
const resolveFieldValue = (fieldName: string, value: string, fieldValues: Record<string, string>): string => {
  if (!value) return 'None';

  try {
    if (DB_LOOKUP_FIELDS.has(fieldName)) {
      return fieldValues[`${fieldName}:${value}`] || value;
    }

    switch (fieldName) {
      case 'people_involved':
        try {
          const people = JSON.parse(value);
          if (!Array.isArray(people) || people.length === 0) {
            return 'None';
          }
          return people.map(person => {
            const role = person.role || 'Other';
            const name = person.name || 'Unknown';
            return `${role} (${name})`;
          }).join(', ');
        } catch (error) {
          console.error('Error parsing people_involved:', error);
          return value;
        }

      case 'documents':
        try {
          const documents = JSON.parse(value);
          if (!Array.isArray(documents) || documents.length === 0) {
            return 'None';
          }
          return documents.map(doc => doc.name || 'Unknown Document').join(', ');
        } catch (error) {
          console.error('Error parsing documents:', error);
          return value;
        }

      case 'date':
        try {
          const date = new Date(value);
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (error) {
          console.error('Error parsing date:', error);
          return value;
        }

      default:
        return value;
    }
  } catch (error) {
    console.error(`Error resolving ${fieldName} value:`, error);
    return value;
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
    'date': 'Date and Time',
    'root_cause_analysis': 'Root Cause Analysis',
    'action_taken': 'Action Taken',
    'comments': 'Comments',
    'documents': 'Supporting Documents',
    'people_involved': 'People Involved',
    'multiple_fields': 'Multiple Fields'
  };

  return fieldMap[fieldName] || fieldName;
};

// Convert raw audit log entries to formatted activities
export const formatAuditLogEntries = async (
  entries: AuditLogEntry[],
  userNames: Record<string, string> = {},
  fieldValues: Record<string, string> = {}
): Promise<FormattedAuditEntry[]> => {
  console.log('=== FORMATTING AUDIT ENTRIES ===');
  console.log('Formatting audit entries count:', entries.length);
  console.log('Raw entries to format:', entries);
  
  const formattedEntries: FormattedAuditEntry[] = [];

  for (const entry of entries) {
    try {
      console.log('Processing audit entry:', entry);
      const userName = getUserName(entry.changed_by, userNames);
      console.log('User name for entry:', userName);
      
      // Determine activity type based on field and change type
      let activityType: FormattedAuditEntry['activity'] = 'update';
      let entityType: FormattedAuditEntry['type'] = 'incident';
      
      if (entry.change_type === 'field_update') {
        if (entry.field_changed === 'status_id' && entry.changes) {
          // Check changes array for status updates
          const statusChange = entry.changes.find((change: Record<string, unknown>) => change.field === 'status_id');
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

      // Create enhanced description from changes if available
      let details = entry.description;
      
      if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
        console.log('Processing changes array:', entry.changes);
        
        if (entry.changes.length === 1) {
          const change = entry.changes[0];
          const fieldName = formatFieldName(change.field);
          
          // Resolve old and new values to human-readable names
          const oldValue = change.old_value ? resolveFieldValue(change.field, change.old_value, fieldValues) : 'None';
          const newValue = change.new_value ? resolveFieldValue(change.field, change.new_value, fieldValues) : 'None';
          
          if (oldValue !== 'None' && newValue !== 'None') {
            // Special handling for people involved and documents to show actual changes
            if (change.field === 'people_involved' || change.field === 'documents') {
              try {
                const oldItems = JSON.parse(change.old_value || '[]');
                const newItems = JSON.parse(change.new_value || '[]');
                
                // Find what was added and removed
                const added = newItems.filter((newItem: Record<string, unknown>) => {
                  if (change.field === 'people_involved') {
                    return !oldItems.some((oldItem: Record<string, unknown>) => oldItem.name === newItem.name);
                  } else {
                    return !oldItems.some((oldItem: Record<string, unknown>) => oldItem.name === newItem.name);
                  }
                });

                const removed = oldItems.filter((oldItem: Record<string, unknown>) => {
                  if (change.field === 'people_involved') {
                    return !newItems.some((newItem: Record<string, unknown>) => newItem.name === oldItem.name);
                  } else {
                    return !newItems.some((newItem: Record<string, unknown>) => newItem.name === oldItem.name);
                  }
                });
                
                // Build the description based on what actually changed
                const changes = [];
                
                if (removed.length > 0) {
                  const removedStr = removed.map((item: Record<string, unknown>) => {
                    if (change.field === 'people_involved') {
                      return `${item.role} (${item.name})`;
                    } else {
                      return item.name;
                    }
                  }).join(', ');
                  changes.push(`Removed "${removedStr}"`);
                }

                if (added.length > 0) {
                  const addedStr = added.map((item: Record<string, unknown>) => {
                    if (change.field === 'people_involved') {
                      return `${item.role} (${item.name})`;
                    } else {
                      return item.name;
                    }
                  }).join(', ');
                  changes.push(`Added "${addedStr}"`);
                }
                
                if (changes.length > 0) {
                  details = `${fieldName}: ${changes.join(', ')}`;
                } else {
                  details = `${fieldName} updated`;
                }
              } catch (error) {
                console.error('Error parsing items for change description:', error);
                details = `${fieldName} changed from "${oldValue}" to "${newValue}"`;
              }
            } else {
              details = `${fieldName} changed from "${oldValue}" to "${newValue}"`;
            }
          } else if (newValue !== 'None') {
            details = `${fieldName} set to "${newValue}"`;
          } else if (oldValue !== 'None') {
            details = `${fieldName} cleared (was "${oldValue}")`;
          } else {
            details = `${fieldName} updated`;
          }
        } else {
          // Multiple changes - create a summary
          const changeDescriptions = [];
          const fieldNames = [];
          
          for (const change of entry.changes) {
            const fieldName = formatFieldName(change.field);
            fieldNames.push(fieldName);
            
            if (change.old_value && change.new_value) {
              const oldValue = resolveFieldValue(change.field, change.old_value, fieldValues);
              const newValue = resolveFieldValue(change.field, change.new_value, fieldValues);
              changeDescriptions.push(`${fieldName}: "${oldValue}" → "${newValue}"`);
            }
          }
          
          if (changeDescriptions.length > 0) {
            details = `Updated ${fieldNames.join(', ')}: ${changeDescriptions.join(', ')}`;
          } else {
            details = `Updated ${entry.changes.length} fields: ${fieldNames.join(', ')}`;
          }
        }
      } else if (!details && entry.change_type === 'field_update') {
        const fieldName = formatFieldName(entry.field_changed);
        if (entry.old_value && entry.new_value) {
          const oldValue = resolveFieldValue(entry.field_changed, entry.old_value, fieldValues);
          const newValue = resolveFieldValue(entry.field_changed, entry.new_value, fieldValues);
          details = `${fieldName} changed from "${oldValue}" to "${newValue}"`;
        } else if (entry.new_value) {
          const newValue = resolveFieldValue(entry.field_changed, entry.new_value, fieldValues);
          details = `${fieldName} set to "${newValue}"`;
        } else if (entry.old_value) {
          const oldValue = resolveFieldValue(entry.field_changed, entry.old_value, fieldValues);
          details = `${fieldName} removed (was "${oldValue}")`;
        } else {
          details = `${fieldName} updated`;
        }
      }

      const formattedEntry: FormattedAuditEntry = {
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
      };

      console.log('Formatted entry created:', formattedEntry);
      formattedEntries.push(formattedEntry);
    } catch (error) {
      console.error('Error formatting audit entry:', error);
      // Continue with next entry instead of failing completely
    }
  }

  // Filter out reopen records from the audit trail
  const filteredEntries = formattedEntries.filter(entry => entry.activity !== 'reopen');
  
  console.log('Total formatted entries:', formattedEntries.length);
  console.log('Entries after filtering out reopen records:', filteredEntries.length);
  console.log('Final formatted entries:', filteredEntries);
  console.log('=== END FORMATTING AUDIT ENTRIES ===');
  return filteredEntries;
};

// Log a manual audit entry (for comments, documents, etc.) - RLS handles client_id automatically
export const logAuditEntry = async (
  incidentId: string,
  fieldChanged: string,
  changedBy: string,
  oldValue?: string,
  newValue?: string,
  changeType: string = 'action',
  description?: string,
  changes?: Record<string, unknown>[]
): Promise<string | null> => {
  try {
    // Get client_id from JWT app_metadata (Feature 3). The audit log row
    // must be tagged with the user's ACTIVE client — not whichever
    // employees row their auth.uid() happens to match first.
    const clientId = await getActiveClientId();
    if (!clientId) {
      throw new Error('Active client not found');
    }

    const { data, error } = await supabase.rpc('insert_incident_audit_log', {
      p_incident_id: incidentId,
      p_client_id: clientId,
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
