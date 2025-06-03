
import { useState, useCallback } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident, IncidentType, IncidentCategory, IncidentLocation, IncidentStatus } from '@/types/incident';
import { toast } from 'sonner';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';
import { useLocation } from 'react-router-dom';

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const location = useLocation();

  // Check if user has incident admin access by finding incidents module
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  const hasIncidentAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Find incidents module by name (more reliable than URL matching)
    const incidentsModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    
    console.log('Incidents module found:', incidentsModule);
    console.log('Access level:', incidentsModule?.accessLevel);
    
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, employeeState.configuredModules]);

  const fetchIncidents = useCallback(async (forceRefresh = false) => {
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

      // Pass employee data and incident admin access for role-based filtering
      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;

      // Use the centralized service with employee data and incident admin access
      const incidentRecords = await incidentDataService.fetchIncidentsForClient(
        clientId, 
        forceRefresh, 
        employeeDataForFiltering,
        hasIncidentAdmin
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
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.employeeData, authEmployeeData, hasIncidentAdmin]);

  const refetchIncidents = useCallback(async () => {
    await fetchIncidents(true); // Force refresh
  }, [fetchIncidents]);

  // Note: Removed automatic useEffect - components must explicitly call fetchIncidents

  return {
    incidents,
    loading,
    error,
    fetchIncidents, // Export this so components can manually trigger fetching
    refetchIncidents,
    hasIncidentAdmin // Export this so components can access the admin status
  };
};
