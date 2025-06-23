
import { useState, useEffect, useCallback } from 'react';
import { fetchIncidentAuditLog, formatAuditLogEntries, FormattedAuditEntry, logAuditEntry } from '@/services/incident/auditLogService';
import { toast } from 'sonner';

export const useIncidentAuditTrail = (incidentId?: string) => {
  const [auditEntries, setAuditEntries] = useState<FormattedAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit trail for the incident
  const fetchAuditTrail = useCallback(async () => {
    console.log('=== FETCH AUDIT TRAIL HOOK DEBUG ===');
    console.log('incidentId received in hook:', incidentId);
    console.log('incidentId type:', typeof incidentId);
    console.log('incidentId truthy:', !!incidentId);
    
    if (!incidentId) {
      console.log('No incident ID provided to hook - setting empty entries');
      setAuditEntries([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting to fetch audit trail for incident:', incidentId);
      const rawEntries = await fetchIncidentAuditLog(incidentId);
      console.log('Raw audit entries received in hook:', rawEntries);
      
      const formattedEntries = await formatAuditLogEntries(rawEntries);
      console.log('Formatted audit entries received in hook:', formattedEntries);
      
      console.log('Setting audit entries state with:', formattedEntries.length, 'entries');
      setAuditEntries(formattedEntries);
    } catch (err) {
      console.error('Error fetching audit trail in hook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit trail';
      setError(errorMessage);
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
      console.log('=== END FETCH AUDIT TRAIL HOOK DEBUG ===');
    }
  }, [incidentId]);

  // Add a manual audit entry
  const addAuditEntry = useCallback(async (
    fieldChanged: string,
    changedBy: string,
    oldValue?: string,
    newValue?: string,
    changeType: string = 'action',
    description?: string
  ) => {
    if (!incidentId) {
      console.error('Cannot add audit entry: no incident ID');
      return;
    }

    try {
      console.log('Adding audit entry:', { fieldChanged, changedBy, oldValue, newValue, changeType, description });
      
      await logAuditEntry(
        incidentId,
        fieldChanged,
        changedBy,
        oldValue,
        newValue,
        changeType,
        description
      );

      // Refresh the audit trail
      await fetchAuditTrail();
    } catch (error) {
      console.error('Error adding audit entry:', error);
      toast.error('Failed to log activity');
    }
  }, [incidentId, fetchAuditTrail]);

  // Fetch audit trail when incident ID changes
  useEffect(() => {
    console.log('=== AUDIT TRAIL HOOK EFFECT ===');
    console.log('useIncidentAuditTrail effect triggered');
    console.log('incidentId in effect:', incidentId);
    console.log('fetchAuditTrail function:', typeof fetchAuditTrail);
    
    fetchAuditTrail();
    
    console.log('=== END AUDIT TRAIL HOOK EFFECT ===');
  }, [fetchAuditTrail]);

  return {
    auditEntries,
    isLoading,
    error,
    refreshAuditTrail: fetchAuditTrail,
    addAuditEntry
  };
};
