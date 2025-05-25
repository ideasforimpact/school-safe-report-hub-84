
import { useState, useEffect } from 'react';
import { fetchIncidentWithRelations, mapIncidentToFormData, IncidentDetail } from '@/services/incident/incidentDetailService';

export const useIncidentDetail = (incidentId?: string) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) {
        console.log('No incident ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('=== LOADING INCIDENT DETAIL ===');
        console.log('Incident ID:', incidentId);
        
        const incidentData = await fetchIncidentWithRelations(incidentId);
        
        if (incidentData) {
          setIncident(incidentData);
          console.log('Incident loaded successfully:', incidentData);
        } else {
          setError('Incident not found');
        }
      } catch (err) {
        console.error('Error loading incident:', err);
        setError('Failed to load incident');
      } finally {
        setIsLoading(false);
      }
    };

    loadIncident();
  }, [incidentId]);

  const getFormData = () => {
    if (!incident) return null;
    return mapIncidentToFormData(incident);
  };

  return {
    incident,
    isLoading,
    error,
    getFormData
  };
};
