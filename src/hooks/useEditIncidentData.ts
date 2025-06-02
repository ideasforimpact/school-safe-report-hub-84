
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
    console.log('=== USE EDIT INCIDENT DATA HOOK ===');
    console.log('useEditIncidentData - Incident ID:', incidentId);
    console.log('useEditIncidentData - User:', user);
    console.log('useEditIncidentData - Auth Employee Data:', authEmployeeData);
    console.log('useEditIncidentData - Employee State:', employeeState);

    if (!incidentId) {
      console.log('useEditIncidentData - No incident ID provided, resetting state');
      setIncidentData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log('useEditIncidentData - Starting fetch process');
        setIsLoading(true);
        setError(null);

        // Get client ID from available sources
        let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
        console.log('useEditIncidentData - Client ID from context:', clientId);

        // If no client ID from context, get from user email
        if (!clientId && user?.email) {
          console.log('useEditIncidentData - No client ID from context, fetching from user email:', user.email);
          const { data: empData } = await supabase
            .from('employees')
            .select('client_id')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
            
          console.log('useEditIncidentData - Employee data from DB:', empData);
          if (empData) {
            clientId = empData.client_id;
            console.log('useEditIncidentData - Client ID from DB:', clientId);
          }
        }

        if (!clientId) {
          console.error('useEditIncidentData - No client ID found');
          throw new Error('No client ID found');
        }

        console.log('useEditIncidentData - Fetching incident data with:', { incidentId, clientId });
        const data = await fetchIncidentForEdit(incidentId, clientId);
        
        if (!data) {
          console.error('useEditIncidentData - No data returned from service');
          throw new Error('Incident not found');
        }

        console.log('useEditIncidentData - Successfully fetched incident data:', data);
        setIncidentData(data);

      } catch (err: any) {
        console.error('useEditIncidentData - Error loading incident for edit:', err);
        setError(err.message || 'Failed to load incident');
        toast.error('Failed to load incident details');
      } finally {
        console.log('useEditIncidentData - Fetch process completed');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [incidentId, employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  console.log('useEditIncidentData - Hook returning:', {
    incidentData: !!incidentData,
    isLoading,
    error
  });

  return {
    incidentData,
    isLoading,
    error
  };
};
