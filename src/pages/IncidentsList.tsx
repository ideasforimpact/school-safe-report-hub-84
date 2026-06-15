
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import Loader from '@/components/common/Loader';

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
  const [showLoader, setShowLoader] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
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
  const [config, setConfig] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState({ total: 0, open: 0, closed: 0 });

  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initFetchKeyRef = useRef<string | null>(null);
  const statsFetchedForClientRef = useRef<string | null>(null);
  const pageSizeRef = useRef<number>(10);
  // Tracks when the most recent intentional fetch completed so realtime events
  // arriving immediately after don't trigger a redundant second fetch.
  const lastFetchCompletedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setShowLoader(false), 300);
    }
  }, [loading]);

  // Check admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  const hasIncidentAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    const incidentsModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, employeeState.configuredModules]);


  // Fetch global stats (unaffected by page filters) so the stats box always shows totals
  useEffect(() => {
    const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
    const employeeDataForStats = employeeState.employeeData || authEmployeeData;
    if (!clientId || !employeeDataForStats) return;
    if (statsFetchedForClientRef.current === clientId) return;
    statsFetchedForClientRef.current = clientId;

    incidentDataService.getIncidentStats(clientId, employeeDataForStats, hasIncidentAdmin).then(stats => {
      setGlobalStats({ total: stats.total, open: stats.open, closed: stats.closed });
    });
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, hasIncidentAdmin]);

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

  const applyClientSideFilters = useCallback((sourceIncidents: IncidentRecord[], activeFilters: ServerFilters) => {
    const normalize = (value: string) => value.trim().toLowerCase();

    return sourceIncidents.filter((incident: any) => {
      if (activeFilters.search) {
        const search = normalize(activeFilters.search);
        const ticket = normalize(incident.ticket_id || '');
        const description = normalize(incident.description || '');
        if (!ticket.includes(search) && !description.includes(search)) return false;
      }

      if (activeFilters.category && incident.category !== activeFilters.category) return false;
      if (activeFilters.subcategory && incident.subcategory !== activeFilters.subcategory) return false;
      if (activeFilters.status && incident.status !== activeFilters.status) return false;
      if (activeFilters.priority && incident.priority !== activeFilters.priority) return false;
      if (activeFilters.location && incident.location !== activeFilters.location) return false;
      if (activeFilters.facility && incident.facility !== activeFilters.facility) return false;

      if (activeFilters.dateFrom || activeFilters.dateTo) {
        const incidentDate = new Date(incident.date);
        if (activeFilters.dateFrom && incidentDate < new Date(activeFilters.dateFrom)) return false;
        if (activeFilters.dateTo && incidentDate > new Date(activeFilters.dateTo)) return false;
      }

      return true;
    });
  }, []);

  // Main fetch function with server-side filtering and pagination
  const fetchIncidents = useCallback(async (
    serverFilters: ServerFilters = {},
    forceRefresh = false,
    page = 1
  ) => {
    try {
      setLoading(true);
      setHasFetched(false);
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
        setLoading(false);
        return;
      }

      const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;
      
      // Call the service to fetch paginated data from server
      const response = await incidentDataService.fetchIncidentsForClientWithFilters(
        clientId,
        forceRefresh,
        employeeDataForFiltering,
        hasIncidentAdmin,
        { page, pageSize: pageSizeRef.current },
        serverFilters,
        true // We still use returnAllData = true logic but it's now server-side paginated
      );

      if (response.config) {
        setConfig(response.config);
      }

      console.log(`✅ Server returned ${response.data.length} incidents (Total matching: ${response.totalCount})`);

      setOriginalIncidents(response.data);
      setAllIncidents(response.data);

      // Update pagination state from server response
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        pageSize: pageSizeRef.current
      });
      
      setDisplayedIncidents(response.data);

    } catch (error: any) {
      console.error('❌ Error fetching incidents:', error);
      toast.error('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
      setHasFetched(true);
      lastFetchCompletedAtRef.current = Date.now();
    }
  }, [
    employeeState.employeeData?.clientId,
    authEmployeeData?.clientId,
    employeeState.employeeData?.id,
    authEmployeeData?.id,
    user?.email,
    hasIncidentAdmin,
  ]);

  // Handle filter changes (triggers server request)
  const handleFilterChange = useCallback((field: string, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    fetchIncidents(newFilters, true, 1);
  }, [filters, fetchIncidents]);

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
    fetchIncidents(emptyFilters, true, 1);
  }, [fetchIncidents]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      fetchIncidents(filters, false, page);
    }
  }, [pagination.totalPages, loading, filters, fetchIncidents]);

  const changePageSize = useCallback((newPageSize: number) => {
    pageSizeRef.current = newPageSize;
    setPagination(prev => ({ ...prev, pageSize: newPageSize }));
    fetchIncidents(filters, false, 1);
  }, [filters, fetchIncidents]);

  // Initial fetch and navigation handling with improved logic
  useEffect(() => {
    const clientIdentity = employeeState.employeeData?.clientId || authEmployeeData?.clientId || user?.email || '';
    if (!clientIdentity || !employeeState.configuredModules) return;

    const filterParam = searchParams.get('filter');
    let tableFilters: ServerFilters = {};

    if (filterParam === 'open') tableFilters.status = 'Open';
    if (filterParam === 'closed') tableFilters.status = 'Closed';

    const initKey = `${clientIdentity}_${location.pathname}_${tableFilters.status || 'all'}`;
    if (initFetchKeyRef.current === initKey) return;
    
    // Only proceed if we have a proper identity
    if (!clientIdentity) return;
    
    initFetchKeyRef.current = initKey;

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

    // Initial fetch
    fetchIncidents(tableFilters, true);
  }, [
    employeeState.employeeData?.clientId,
    authEmployeeData?.clientId,
    user?.email,
    employeeState.configuredModules,
    hasIncidentAdmin,
    location.pathname,
    searchParams,
    // fetchIncidents is omitted to prevent loop if it's unstable
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
  const handleIncidentsRealtime = useCallback(() => {
    // Skip if a fresh fetch just completed within the last 3 seconds to avoid
    // a duplicate request when realtime fires immediately after initial load.
    if (Date.now() - lastFetchCompletedAtRef.current < 3000) return;
    fetchIncidents(filters, true);
  }, [fetchIncidents, filters]);

  const dbCategoryOptions = useMemo(
    () => {
      if (config?.categories) return Array.from(new Set(config.categories.map((c: any) => c.name).filter(Boolean))).sort();
      return Array.from(new Set(originalIncidents.map((inc) => inc.category).filter(Boolean))).sort();
    },
    [originalIncidents, config]
  );
  const dbSubcategoryOptions = useMemo(
    () => {
      if (config?.subcategories) return Array.from(new Set(config.subcategories.map((c: any) => c.name).filter(Boolean))).sort();
      return Array.from(new Set(originalIncidents.map((inc) => inc.subcategory).filter(Boolean))).sort();
    },
    [originalIncidents, config]
  );
  const dbPriorityOptions = useMemo(
    () => {
      if (config?.priorities) return Array.from(new Set(config.priorities.map((p: any) => p.name).filter(Boolean))).sort();
      return Array.from(new Set(originalIncidents.map((inc) => inc.priority).filter(Boolean))).sort();
    },
    [originalIncidents, config]
  );
  const dbLocationOptions = useMemo(
    () => {
      if (config?.locations) return Array.from(new Set(config.locations.map((l: any) => l.name).filter(Boolean))).sort();
      return Array.from(new Set(originalIncidents.map((inc) => inc.location).filter(Boolean))).sort();
    },
    [originalIncidents, config]
  );
  const dbStatusOptions = useMemo(() => {
    if (config?.statuses) {
      const statuses = Array.from(new Set(config.statuses.map((s: any) => s.name).filter(Boolean)));
      if (!statuses.includes('Reopen')) statuses.push('Reopen');
      return statuses.sort();
    }
    const statuses = Array.from(new Set(originalIncidents.map((inc) => inc.status).filter(Boolean)));
    if (!statuses.includes('Reopen')) statuses.push('Reopen');
    return statuses.sort();
  }, [originalIncidents, config]);

  useRealTimeSubHook({
    channelName: 'incidents-realtime',
    events: '*',
    table: 'incidents',
    enabled: true,
    onPayload: handleIncidentsRealtime,
  });

  if (showLoader) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader text="Loading incidents..." />
        </div>
      </Layout>
    );
  }

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
                  {globalStats.total}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Open Incidents</p>
                <p className="text-3xl font-semibold text-orange-600">
                  {globalStats.open}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Closed Incidents</p>
                <p className="text-3xl font-semibold text-green-600">
                  {globalStats.closed}
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
            hasFetched={hasFetched}
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
