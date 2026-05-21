
import { useState, useEffect } from 'react';
import { fetchIncidentForEdit, EditIncidentData } from '@/services/incident/editIncidentService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { toast } from 'sonner';

export const useEditIncidentData = (incidentId?: string) => {
  const [incidentData, setIncidentData] = useState<EditIncidentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { employeeData: authEmployeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

  useEffect(() => {
    if (!incidentId || !clientId) {
      setIncidentData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchIncidentForEdit(incidentId, clientId);
        if (cancelled) return;
        if (!data) throw new Error('Incident not found');
        setIncidentData(data);

      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load incident');
        toast.error('Failed to load incident details');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [incidentId, clientId]);

  return { incidentData, isLoading, error };
};
