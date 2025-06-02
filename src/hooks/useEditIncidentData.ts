
import { useState, useEffect } from 'react';
import { fetchIncidentForEdit, EditIncidentData } from '@/services/incident/editIncidentService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEditIncidentData = (incidentId?: string) => {
  const [incidentData, setIncidentData] = useState<EditIncidentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();

  useEffect(() => {
    if (!incidentId) {
      setIncidentData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get client ID from available sources
        let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

        // If no client ID from context, get from user email
        if (!clientId && user?.email) {
          const { data: empData } = await supabase
            .from('employees')
            .select('client_id')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
            
          if (empData) {
            clientId = empData.client_id;
          }
        }

        if (!clientId) {
          throw new Error('No client ID found');
        }

        console.log('Fetching incident data for edit:', { incidentId, clientId });
        const data = await fetchIncidentForEdit(incidentId, clientId);
        
        if (!data) {
          throw new Error('Incident not found');
        }

        setIncidentData(data);

      } catch (err: any) {
        console.error('Error loading incident for edit:', err);
        setError(err.message || 'Failed to load incident');
        toast.error('Failed to load incident details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [incidentId, employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  return {
    incidentData,
    isLoading,
    error
  };
};
