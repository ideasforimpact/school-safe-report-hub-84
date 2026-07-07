
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapIncidentToFormData, IncidentDetail } from '@/services/incident/incidentDetailService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/useAuth';

// Module-level in-flight dedup: prevents concurrent fetches for the same incident+client
const detailInflight = new Map<string, Promise<void>>();

export const useIncidentDetail = (incidentId?: string) => {
  const { employeeData } = useAuth();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [contributingFactors, setContributingFactors] = useState<Array<{ id: string; name: string; weight: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async (id: string, forceRefresh = false) => {
    if (!employeeData?.clientId) return;

    const key = `${id}_${employeeData.clientId}`;

    // On forced refresh (reload), clear any stale in-flight so we fetch fresh
    if (forceRefresh) detailInflight.delete(key);

    // If already in-flight for the same key, skip — state will be set by the active request
    if (detailInflight.has(key)) return;

    setIsLoading(true);
    setError(null);
    setIncident(null);

    let resolveDone!: () => void;
    const done = new Promise<void>(r => { resolveDone = r; });
    detailInflight.set(key, done);

    try {
      const { data: resData, error: invokeError } = await supabase.functions.invoke('fetch-incidents', {
        body: {
          operation: 'get_incident_detail',
          incidentId: id,
          clientId: employeeData.clientId
        }
      });

      if (invokeError) throw invokeError;

      if (resData?.success && resData?.incident) {
        setIncident(resData.incident);
        setContributingFactors(resData.contributingFactors || []);
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
      detailInflight.delete(key);
      resolveDone();
    }
  }, [employeeData?.clientId]);

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
    contributingFactors,
    isLoading,
    error,
    getFormData,
    reload: () => incidentId && loadIncident(incidentId, true)
  };
};
