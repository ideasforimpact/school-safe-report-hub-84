
import { useState, useEffect, useCallback } from 'react';
import { fetchIncidentAuditLog, formatAuditLogEntries, FormattedAuditEntry, logAuditEntry } from '@/services/incident/auditLogService';
import { toast } from 'sonner';

export const useIncidentAuditTrail = (incidentId?: string) => {
  const [auditEntries, setAuditEntries] = useState<FormattedAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit trail for the incident
  const fetchAuditTrail = useCallback(async () => {
    if (!incidentId) {
      console.log('No incident ID provided');
      setAuditEntries([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching audit trail for incident:', incidentId);
      const rawEntries = await fetchIncidentAuditLog(incidentId);
      console.log('Raw audit entries:', rawEntries);
      
      const formattedEntries = await formatAuditLogEntries(rawEntries);
      console.log('Formatted audit entries:', formattedEntries);
      
      setAuditEntries(formattedEntries);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
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
    console.log('useIncidentAuditTrail effect triggered, incidentId:', incidentId);
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  return {
    auditEntries,
    isLoading,
    error,
    refreshAuditTrail: fetchAuditTrail,
    addAuditEntry
  };
};
