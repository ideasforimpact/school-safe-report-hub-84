
import { useState, useEffect, useCallback } from 'react';
import { fetchIncidentWithRelations, mapIncidentToFormData, IncidentDetail } from '@/services/incident/incidentDetailService';

export const useIncidentDetail = (incidentId?: string) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const incidentData = await fetchIncidentWithRelations(id);
      
      if (incidentData) {
        setIncident(incidentData);
      } else {
        setError('Incident not found');
      }
    } catch (err) {
      console.error('Error loading incident:', err);
      setError('Failed to load incident');
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
    getFormData
  };
};
