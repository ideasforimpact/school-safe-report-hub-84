
import { useState, useCallback } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident, IncidentType, IncidentCategory, IncidentLocation, IncidentStatus } from '@/types/incident';
import { toast } from 'sonner';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  pageSize: number;
}

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasMore: false,
    pageSize: 10
  });
  
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();

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

  const fetchIncidents = useCallback(async (forceRefresh = false, page = 1, pageSize = 10) => {
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
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasMore: false,
          pageSize: 10
        });
        return;
      }

      console.log('Fetching incidents for client:', clientId, 'page:', page, 'pageSize:', pageSize);

      // Pass employee data and incident admin access for role-based filtering
      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;

      // Use the centralized service with pagination
      const response = await incidentDataService.fetchIncidentsForClient(
        clientId, 
        forceRefresh, 
        employeeDataForFiltering,
        hasIncidentAdmin,
        { page, pageSize }
      );

      // Transform the data with proper type casting
      const transformedIncidents: Incident[] = response.data.map((record) => ({
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
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        pageSize
      });

      console.log(`Successfully fetched ${transformedIncidents.length} incidents (page ${response.currentPage} of ${response.totalPages})`);

    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.employeeData, authEmployeeData, hasIncidentAdmin]);

  const refetchIncidents = useCallback(async () => {
    await fetchIncidents(true, pagination.currentPage, pagination.pageSize); // Force refresh
  }, [fetchIncidents, pagination.currentPage, pagination.pageSize]);

  const loadNextPage = useCallback(async () => {
    if (pagination.hasMore && !loading) {
      await fetchIncidents(false, pagination.currentPage + 1, pagination.pageSize);
    }
  }, [fetchIncidents, pagination.hasMore, pagination.currentPage, pagination.pageSize, loading]);

  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      await fetchIncidents(false, page, pagination.pageSize);
    }
  }, [fetchIncidents, pagination.totalPages, pagination.pageSize, loading]);

  const changePageSize = useCallback(async (newPageSize: number) => {
    await fetchIncidents(false, 1, newPageSize); // Reset to page 1 when changing page size
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    pagination,
    fetchIncidents,
    refetchIncidents,
    loadNextPage,
    goToPage,
    changePageSize,
    hasIncidentAdmin
  };
};
