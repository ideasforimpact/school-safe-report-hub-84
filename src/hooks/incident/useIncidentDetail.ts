
import { useState, useEffect, useCallback } from 'react';
import { fetchIncidentWithRelationsOptimized } from '@/services/incident/optimizedIncidentDetailService';
import { mapIncidentToFormData, IncidentDetail } from '@/services/incident/incidentDetailService';
import { toast } from 'sonner';

export const useIncidentDetail = (incidentId?: string) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    // Clear previous incident while fetching to avoid stale detail data across client switches.
    setIncident(null);

    try {
      const incidentData = await fetchIncidentWithRelationsOptimized(id);
      
      if (incidentData) {
        setIncident(incidentData);
      } else {
        setIncident(null);
        setError('Incident not found');
        toast.error('Incident not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load incident';
      setIncident(null);
      setError(errorMessage);
      
      if (errorMessage.includes('timeout')) {
        toast.error('Request timed out. Please try again or contact support if the issue persists.');
      } else {
        toast.error('Failed to load incident details');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (incidentId) {
      loadIncident(incidentId);
    } else {
      setIncident(null);
      setError(null);
      setIsLoading(false);
    }
  }, [incidentId, loadIncident]);

  const getFormData = useCallback(() => {
    if (!incident) return null;
    return mapIncidentToFormData(incident);
  }, [incident]);

  return {
    incident,
    isLoading,
    error,
    getFormData,
    reload: () => incidentId && loadIncident(incidentId)
  };
};
