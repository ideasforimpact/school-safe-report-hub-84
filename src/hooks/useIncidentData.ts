
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

  // Check if user has super admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  // Check if user has incident admin access by finding incidents module
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
        console.log('No client ID found');
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

      // Get employee data for filtering
      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;
      
      // Early return if no employee data is available
      if (!employeeDataForFiltering || !employeeDataForFiltering.id) {
        console.log('⚠️ No employee data available, cannot fetch incidents');
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
      console.log('User is super admin:', isSuperAdmin);

      // Clear cache if force refresh
      if (forceRefresh) {
        incidentDataService.clearCache(clientId, employeeDataForFiltering.id);
        console.log('🗑️ Cache cleared due to force refresh');
      }

      // Ensure the employee data includes the super admin status
      const enhancedEmployeeData = {
        ...employeeDataForFiltering,
        isSuperAdmin: isSuperAdmin
      };

      console.log('Enhanced employee data for filtering:', enhancedEmployeeData);

      // Call the edge function to fetch incidents
      const { data, error } = await supabase.functions.invoke('fetch-incidents', {
        body: {
          clientId: clientId,
          employeeId: enhancedEmployeeData.id,
          isSuperAdmin: isSuperAdmin,
          hasIncidentAdmin: hasIncidentAdmin
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch incidents');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to fetch incidents');
      }

      // Transform the data with proper type casting
      const incidents = data.incidents || [];
      const transformedIncidents: Incident[] = incidents.map((record: any) => ({
        id: record.id,
        ticketId: record.ticket_id,
        type: record.incident_report_types?.name as IncidentType,
        category: record.incident_categories?.name as IncidentCategory,
        subcategory: record.incident_subcategories?.name,
        description: record.description,
        date: record.date,
        location: record.campuses?.name as IncidentLocation,
        peopleInvolved: record.people_involved || [],
        status: record.incident_status?.name as IncidentStatus,
        reportedBy: {
          id: record.created_by || '',
          name: record.created_by_employee ? `${record.created_by_employee.first_name} ${record.created_by_employee.last_name}` : 'Unknown'
        },
        owner: record.assigned_employee ? {
          id: record.assigned_to || '',
          name: `${record.assigned_employee.first_name} ${record.assigned_employee.last_name}`
        } : undefined,
        facility: record.facilities?.name,
        documents: record.documents || [],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        priority: record.incident_priorities?.name as 'Low' | 'Medium' | 'High' | 'Critical',
        comments: record.comments || [],
        createdBy: record.created_by,
        assignedTo: record.assigned_to
      }));

      // Calculate pagination info (for now, we'll use client-side pagination)
      const totalCount = transformedIncidents.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedIncidents = transformedIncidents.slice(startIndex, endIndex);

      setIncidents(paginatedIncidents);
      setPagination({
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages,
        pageSize
      });

      console.log(`Successfully fetched ${transformedIncidents.length} incidents`);
      console.log(`Access level: ${isSuperAdmin ? 'Super Admin (all incidents)' : hasIncidentAdmin ? 'Incident Admin (all incidents, limited edit)' : 'Regular User (filtered incidents)'}`);

    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      setError(error.message);
      toast.error('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.employeeData, authEmployeeData, hasIncidentAdmin, isSuperAdmin]);

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
    hasIncidentAdmin,
    isSuperAdmin
  };
};
