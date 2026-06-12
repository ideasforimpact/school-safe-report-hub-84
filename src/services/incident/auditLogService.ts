
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

// Fetch audit log entries for a specific incident (RLS handles client filtering automatically)
export const fetchIncidentAuditLog = async (incidentId: string): Promise<AuditLogEntry[]> => {
  try {
    console.log('=== AUDIT LOG SERVICE DEBUG ===');
    console.log('Fetching audit trail for incident:', incidentId);
    
    // RLS policies now handle client filtering automatically - no need for manual checks
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
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit log:', error);
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    console.log('Audit entries found:', data?.length || 0);
    console.log('Audit entries:', data);
    console.log('=== END AUDIT LOG SERVICE DEBUG ===');

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

// Helper function to get user name from employee data using user_id
const getUserName = async (userId: string): Promise<string> => {
  try {
    console.log('Looking up user name for user_id:', userId);
    
    // First try to look up by user_id (for newer entries). Multi-client
    // users have N rows with the same user_id — for display purposes any
    // of them yields the same name, so .limit(1).maybeSingle() is fine.
    const { data: employee, error } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (employee && !error) {
      const fullName = `${employee.first_name} ${employee.last_name}`;
      console.log('Found employee name by user_id:', fullName);
      return fullName;
    }

    // Fallback: try to look up by employee id (for older entries or edge function entries)
    console.log('User not found by user_id, trying by employee id:', userId);
    const { data: employeeById, error: errorById } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (employeeById && !errorById) {
      const fullName = `${employeeById.first_name} ${employeeById.last_name}`;
      console.log('Found employee name by employee id:', fullName);
      return fullName;
    }

    console.log('Employee not found by either user_id or employee id:', userId);
    return 'Unknown User';
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
};

// Helper function to resolve field values to human-readable names
const resolveFieldValue = async (fieldName: string, value: string): Promise<string> => {
  if (!value) return 'None';
  
  try {
    switch (fieldName) {
      case 'status_id':
        const { data: status } = await supabase
          .from('incident_status')
          .select('name')
          .eq('id', value)
          .single();
        return status?.name || value;
        
      case 'priority_id':
        const { data: priority } = await supabase
          .from('incident_priorities')
          .select('name')
          .eq('id', value)
          .single();
        return priority?.name || value;
        
      case 'category_id':
        const { data: category } = await supabase
          .from('incident_categories')
          .select('name')
          .eq('id', value)
          .single();
        return category?.name || value;
        
      case 'subcategory_id':
        const { data: subcategory } = await supabase
          .from('incident_subcategories')
          .select('name')
          .eq('id', value)
          .single();
        return subcategory?.name || value;
        
      case 'type_id':
        const { data: type } = await supabase
          .from('incident_report_types')
          .select('name')
          .eq('id', value)
          .single();
        return type?.name || value;
        
      case 'assigned_to':
        const { data: assignee } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', value)
          .single();
        return assignee ? `${assignee.first_name} ${assignee.last_name}` : value;
        
      case 'facility_id':
        const { data: facility } = await supabase
          .from('facilities')
          .select('name')
          .eq('id', value)
          .single();
        return facility?.name || value;
        
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
export const formatAuditLogEntries = async (entries: AuditLogEntry[]): Promise<FormattedAuditEntry[]> => {
  console.log('=== FORMATTING AUDIT ENTRIES ===');
  console.log('Formatting audit entries count:', entries.length);
  console.log('Raw entries to format:', entries);
  
  const formattedEntries: FormattedAuditEntry[] = [];

  for (const entry of entries) {
    try {
      console.log('Processing audit entry:', entry);
      const userName = await getUserName(entry.changed_by);
      console.log('User name for entry:', userName);
      
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

      // Create enhanced description from changes if available
      let details = entry.description;
      
      if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
        console.log('Processing changes array:', entry.changes);
        
        if (entry.changes.length === 1) {
          const change = entry.changes[0];
          const fieldName = formatFieldName(change.field);
          
          // Resolve old and new values to human-readable names
          const oldValue = change.old_value ? await resolveFieldValue(change.field, change.old_value) : 'None';
          const newValue = change.new_value ? await resolveFieldValue(change.field, change.new_value) : 'None';
          
          if (oldValue !== 'None' && newValue !== 'None') {
            // Special handling for people involved and documents to show actual changes
            if (change.field === 'people_involved' || change.field === 'documents') {
              try {
                const oldItems = JSON.parse(change.old_value || '[]');
                const newItems = JSON.parse(change.new_value || '[]');
                
                // Find what was added and removed
                const added = newItems.filter((newItem: any) => {
                  if (change.field === 'people_involved') {
                    return !oldItems.some((oldItem: any) => oldItem.name === newItem.name);
                  } else {
                    return !oldItems.some((oldItem: any) => oldItem.name === newItem.name);
                  }
                });
                
                const removed = oldItems.filter((oldItem: any) => {
                  if (change.field === 'people_involved') {
                    return !newItems.some((newItem: any) => newItem.name === oldItem.name);
                  } else {
                    return !newItems.some((newItem: any) => newItem.name === oldItem.name);
                  }
                });
                
                // Build the description based on what actually changed
                const changes = [];
                
                if (removed.length > 0) {
                  const removedStr = removed.map((item: any) => {
                    if (change.field === 'people_involved') {
                      return `${item.role} (${item.name})`;
                    } else {
                      return item.name;
                    }
                  }).join(', ');
                  changes.push(`Removed "${removedStr}"`);
                }
                
                if (added.length > 0) {
                  const addedStr = added.map((item: any) => {
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
              const oldValue = await resolveFieldValue(change.field, change.old_value);
              const newValue = await resolveFieldValue(change.field, change.new_value);
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
          const oldValue = await resolveFieldValue(entry.field_changed, entry.old_value);
          const newValue = await resolveFieldValue(entry.field_changed, entry.new_value);
          details = `${fieldName} changed from "${oldValue}" to "${newValue}"`;
        } else if (entry.new_value) {
          const newValue = await resolveFieldValue(entry.field_changed, entry.new_value);
          details = `${fieldName} set to "${newValue}"`;
        } else if (entry.old_value) {
          const oldValue = await resolveFieldValue(entry.field_changed, entry.old_value);
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
  changes?: any[]
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
