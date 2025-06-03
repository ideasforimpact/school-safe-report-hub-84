
import { useState, useCallback } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident, IncidentType, IncidentCategory, IncidentLocation, IncidentStatus } from '@/types/incident';
import { toast } from 'sonner';
import { incidentDataService } from '@/services/incident/incidentDataService';

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
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
        setIncidents([]);
        return;
      }

      console.log('Fetching incidents for client:', clientId);

      // Pass employee data for role-based filtering
      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;

      // Use the centralized service with employee data
      const incidentRecords = await incidentDataService.fetchIncidentsForClient(
        clientId, 
        false, 
        employeeDataForFiltering
      );

      // Transform the data with proper type casting
      const transformedIncidents: Incident[] = incidentRecords.map((record) => ({
        id: record.id,
        ticketId: record.ticket_id,
        type: record.type as IncidentType,
        category: record.category as IncidentCategory,
        subcategory: record.subcategory,
        description: record.description,
        date: record.date,
        location: record.location as IncidentLocation,
        peopleInvolved: [],
        status: record.status as IncidentStatus,
        reportedBy: {
          id: '',
          name: record.reportedBy
        },
        owner: record.owner ? {
          id: '',
          name: record.owner
        } : undefined,
        facility: record.facility,
        documents: [],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        priority: record.priority as 'Low' | 'Medium' | 'High' | 'Critical',
        comments: []
      }));

      setIncidents(transformedIncidents);
      console.log(`Successfully fetched ${transformedIncidents.length} incidents`);

    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.employeeData, authEmployeeData]);

  const refetchIncidents = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  // Note: Removed automatic useEffect - components must explicitly call fetchIncidents

  return {
    incidents,
    loading,
    error,
    fetchIncidents, // Export this so components can manually trigger fetching
    refetchIncidents
  };
};
