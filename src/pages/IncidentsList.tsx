
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { IncidentRecord } from '@/services/incidentService';
import { incidentDataService } from '@/services/incident/incidentDataService';
import LazyIncidentsTable from '@/components/incidents/LazyIncidentsTable';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useFilterOptions } from '@/hooks/filters/useFilterOptions';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  pageSize: number;
}

interface ServerFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  priority?: string;
  location?: string;
  facility?: string;
  dateFrom?: string;
  dateTo?: string;
}

const IncidentsList = () => {
  // All incidents loaded from server (based on current filters)
  const [allIncidents, setAllIncidents] = useState<IncidentRecord[]>([]);
  // Original incidents (unfiltered) - preserved for restoration
  const [originalIncidents, setOriginalIncidents] = useState<IncidentRecord[]>([]);
  // Currently displayed incidents (client-side pagination slice)
  const [displayedIncidents, setDisplayedIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasMore: false,
    pageSize: 10
  });

  // Server-side filters - Start with empty filters
  const [filters, setFilters] = useState<ServerFilters>({
    search: '',
    category: '',
    subcategory: '',
    status: '',
    priority: '',
    location: '',
    facility: '',
    dateFrom: '',
    dateTo: ''
  });

  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get filter options from database
  const { 
    statusOptions: dbStatusOptions, 
    priorityOptions: dbPriorityOptions,
    categoryOptions: dbCategoryOptions,
    subcategoryOptions: dbSubcategoryOptions,
    locationOptions: dbLocationOptions 
  } = useFilterOptions();

  // Check admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  const hasIncidentAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    const incidentsModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, employeeState.configuredModules]);


  // Client-side pagination function
  const applyClientSidePagination = useCallback((incidents: IncidentRecord[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = incidents.slice(startIndex, endIndex);
    const totalPages = Math.ceil(incidents.length / pageSize);
    
    setDisplayedIncidents(paginatedData);
    setPagination({
      currentPage: page,
      totalPages,
      totalCount: incidents.length,
      hasMore: page < totalPages,
      pageSize
    });
    
    console.log(`📄 Client-side pagination: Page ${page}/${totalPages}, showing ${paginatedData.length} of ${incidents.length} total incidents`);
  }, []);

  const fetchOriginalIncidents = useCallback(async () => {
    let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
    if (!clientId) return [];

    const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;

    const response = await incidentDataService.fetchIncidentsForClientWithFilters(
      clientId,
      true, 
      employeeDataForFiltering,
      hasIncidentAdmin,
      { page: 1, pageSize: pagination.pageSize },
      {},
      true
    );
    
    setOriginalIncidents(response.data);
    return response.data;
  }, [employeeState.employeeData, authEmployeeData, hasIncidentAdmin]);


  // Main fetch function with server-side filtering (eager loading)
  const fetchIncidents = useCallback(async (
    serverFilters: ServerFilters = {},
    forceRefresh = false
  ) => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching ALL incidents with filters (EAGER LOADING):`, serverFilters);

      // Get client ID
      let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

      if (!clientId && user?.email) {
        const { data: empData, error } = await supabase
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
        setAllIncidents([]);
        setDisplayedIncidents([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasMore: false,
          pageSize: 10
        });
        setLoading(false);
        return;
      }

      // Clear cache if force refresh
      if (forceRefresh) {
        const employeeId = employeeState.employeeData?.id || authEmployeeData?.id;
        incidentDataService.clearCache(clientId, employeeId);
        console.log('🗑️ Cache cleared due to force refresh');
      }

      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;
      
      // Call the service to fetch ALL matching incidents (returnAllData = true)
      const response = await incidentDataService.fetchIncidentsForClientWithFilters(
        clientId,
        forceRefresh,
        employeeDataForFiltering,
        hasIncidentAdmin,
        { page: 1, pageSize: pagination.pageSize }, // Not used when returnAllData = true
        serverFilters,
        true // returnAllData = true - get ALL incidents for client-side pagination
      );
      

      console.log(`✅ Server returned ${response.totalCount} total incidents (ALL matching records)`);

      // Always preserve original incidents for restoration
    

      // Apply URL-driven client-side filter: students_involved => include incidents with at least one Student
      const studentsFilterActive = searchParams.get('filter') === 'students_involved';
      const filteredByStudents = studentsFilterActive
        ? response.data.filter((incident: any) => {
            const people = (incident as any)?.peopleInvolved || (incident as any)?.people_involved;
            if (!Array.isArray(people) || people.length === 0) return false;
            return people.some((p: any) => (p?.role || '').toLowerCase() === 'student');
          })
        : response.data;

      // Store incidents after optional filter
      setAllIncidents(filteredByStudents);

      // Apply client-side pagination to show first page
      applyClientSidePagination(filteredByStudents, 1, pagination.pageSize);

    } catch (error: any) {
      console.error('❌ Error fetching incidents:', error);
      if (error.message?.includes('timeout')) {
        toast.error('Request timed out. Please try again or contact support if the issue persists.');
      } else {
        toast.error('Failed to load incidents. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.employeeData, authEmployeeData, hasIncidentAdmin, pagination.pageSize, applyClientSidePagination]);

  // Handle filter changes (triggers server request)
  const handleFilterChange = useCallback((field: string, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    console.log(`🔧 Filter changed: ${field} = ${value}`);
    
    // Fetch with new filters (this will load ALL matching records)
    fetchIncidents(newFilters, false);
  }, [filters, fetchIncidents]);

  // Handle query parameter removal - restore original incidents

  // Clear all filters (triggers server request)
  const clearFilters = useCallback(() => {
    const emptyFilters = {
      search: '',
      category: '',
      subcategory: '',
      status: '',
      priority: '',
      location: '',
      facility: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(emptyFilters);
    console.log('🧹 All filters cleared');
    fetchIncidents(emptyFilters, false);
  }, [fetchIncidents]);

  // Client-side pagination handlers (NO API calls)
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      console.log(`📄 Navigating to page ${page} (CLIENT-SIDE)`);
      applyClientSidePagination(allIncidents, page, pagination.pageSize);
    }
  }, [pagination.totalPages, pagination.pageSize, loading, allIncidents, applyClientSidePagination]);

  const changePageSize = useCallback((newPageSize: number) => {
    console.log(`📏 Changing page size to ${newPageSize} (CLIENT-SIDE)`);
    applyClientSidePagination(allIncidents, 1, newPageSize); // Reset to page 1 when changing page size
  }, [allIncidents, applyClientSidePagination]);

  // Initial fetch and navigation handling with improved logic
 useEffect(() => {
  const init = async () => {
    const ready =
      (employeeState.employeeData?.clientId ||
        authEmployeeData?.clientId ||
        user?.email) &&
      employeeState.configuredModules;

    if (!ready) return;

    await fetchOriginalIncidents();

    const filterParam = searchParams.get('filter');
    let tableFilters: ServerFilters = {};

    if (filterParam === 'open') tableFilters.status = 'Open';
    if (filterParam === 'closed') tableFilters.status = 'Closed';

      setFilters({
        search: '',
        category: '',
        subcategory: '',
        status: tableFilters.status || '',
        priority: '',
        location: '',
        facility: '',
        dateFrom: '',
        dateTo: ''
      });

    fetchIncidents(tableFilters, false);
  };

  init();
}, [
  employeeState.employeeData?.clientId,
  authEmployeeData?.clientId,
  user?.email,
  employeeState.configuredModules,
  hasIncidentAdmin,
  location.pathname
]);

  console.log('📋 IncidentsList render (EAGER LOADING) - Current page:', pagination.currentPage, 'Total pages:', pagination.totalPages);
  console.log('📊 Total incidents cached:', allIncidents.length, 'Currently displayed:', displayedIncidents.length);
  console.log('🔍 Active filters:', filters);

const incidentAnalyticsStats = useMemo(() => {
  return {
    total: originalIncidents.length,
    open: originalIncidents.filter(i => i.status === 'Open').length,
    closed: originalIncidents.filter(i => i.status === 'Closed').length,
  };
}, [originalIncidents]);
  const handleIncidentsRealtime = useCallback(
    (payload: any) => {
      fetchOriginalIncidents();
    },
    [fetchOriginalIncidents]
  );

  useRealTimeSubHook({
    channelName: 'incidents-realtime',
    events: '*',
    table: 'incidents',
    enabled: true,
    onPayload: handleIncidentsRealtime,
  });

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="w-full">
            <IncidentsHeader hasIncidentAdmin={hasIncidentAdmin} />
            <div className="mt-4 flex gap-96">
              <div className='ms-16'>
                <p className="text-sm text-gray-500">Total Incidents</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {incidentAnalyticsStats.total}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Open Incidents</p>
                <p className="text-3xl font-semibold text-orange-600">
                  {incidentAnalyticsStats.open}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Closed Incidents</p>
                <p className="text-3xl font-semibold text-green-600">
                  {incidentAnalyticsStats.closed}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
          <IncidentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableCategories={dbCategoryOptions}
            availableSubcategories={dbSubcategoryOptions}
            availableLocations={dbLocationOptions}
            availableFacilities={[]}
            availableOwners={[]}
            priorityOptions={dbPriorityOptions}
            locationOptions={dbLocationOptions}
            statusOptions={dbStatusOptions}
          />
          
          <LazyIncidentsTable 
            incidents={displayedIncidents} 
            loading={loading}
            pagination={pagination}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            onRefreshIncidents={async () => {
              // Refresh incidents with current filters
              await fetchIncidents(filters, true);
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
