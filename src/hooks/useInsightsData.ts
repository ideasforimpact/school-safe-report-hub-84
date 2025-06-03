
import { useMemo, useState } from 'react';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/AuthContext';
import { useFacilities } from '@/contexts/FacilityContext';
import { DateRange } from 'react-day-picker';
import { DateRangeFilter } from '@/utils/dateRangeUtils';
import { 
  applyFilters, 
  processCategoryData,
  processSubcategoryData,
  processTypeData,
  processStatusData,
  processTimeSeriesData,
  processLocationData,
  processFacilityData,
  processAssigneeData,
  processHeatmapData,
  processRiskData,
  extractUniqueValues
} from '@/utils/insights/dataProcessors';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useEffect } from 'react';

export interface InsightsFiltersState {
  dateFilter: DateRangeFilter;
  typeFilter: string;
  categoryFilter: string;
  subcategoryFilter: string;
  facilityFilter: string;
  personFilter: string;
  roleFilter: string;
  dateRange: DateRange | undefined;
}

export const useInsightsData = () => {
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get facilities with error handling in case the context is not available
  let facilities = [];
  try {
    const facilityContext = useFacilities();
    facilities = facilityContext.facilities;
  } catch (error) {
    console.warn('Facility context not available:', error);
    facilities = [];
  }
  
  // Filters state
  const [filters, setFilters] = useState<InsightsFiltersState>({
    dateFilter: 'month',
    typeFilter: 'all',
    categoryFilter: 'all',
    subcategoryFilter: 'all',
    facilityFilter: 'all',
    personFilter: 'all',
    roleFilter: 'all',
    dateRange: undefined
  });

  // Fetch incidents data for insights
  useEffect(() => {
    const fetchIncidentsForInsights = async () => {
      try {
        setIsLoading(true);

        // Get client ID from available sources
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
          setIncidents([]);
          return;
        }

        const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;
        const hasIncidentAdmin = employeeState.configuredModules?.find(
          module => module.name.toLowerCase() === 'incidents'
        )?.accessLevel?.is_admin === true;

        const fetchedIncidents = await incidentDataService.fetchIncidentsForClient(
          clientId, 
          false, 
          employeeDataForFiltering,
          hasIncidentAdmin
        );

        // Transform incidents to the format expected by insights
        const transformedIncidents = fetchedIncidents.map(record => ({
          id: record.id,
          ticketId: record.ticket_id,
          type: record.type,
          category: record.category,
          subcategory: record.subcategory,
          description: record.description,
          date: record.date,
          location: record.location,
          peopleInvolved: [],
          status: record.status,
          reportedBy: { id: '', name: record.reportedBy },
          owner: record.owner ? { id: '', name: record.owner } : undefined,
          facility: record.facility,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          priority: record.priority
        }));
        
        setIncidents(transformedIncidents);
        console.log('Insights incidents fetched successfully:', transformedIncidents.length);

      } catch (error) {
        console.error('Error fetching incidents for insights:', error);
        setIncidents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if ((employeeState.employeeData?.clientId || authEmployeeData?.clientId || user?.email) && 
        employeeState.configuredModules) {
      fetchIncidentsForInsights();
    }
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email, employeeState.configuredModules]);
  
  // Apply filters to get filtered incidents
  const filteredIncidents = useMemo(() => {
    return applyFilters(
      incidents,
      filters.dateFilter,
      filters.dateRange,
      filters.typeFilter,
      filters.categoryFilter,
      filters.subcategoryFilter,
      filters.facilityFilter,
      filters.personFilter,
      filters.roleFilter,
      false // isAdmin - we'll handle this properly later
    );
  }, [incidents, filters]);
  
  // Extract unique values for filter options
  const { availableSubcategories, peopleInvolved } = useMemo(
    () => extractUniqueValues(incidents),
    [incidents]
  );
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      categoryData: processCategoryData(filteredIncidents),
      subcategoryData: processSubcategoryData(filteredIncidents),
      typeData: processTypeData(filteredIncidents),
      statusData: processStatusData(filteredIncidents),
      timeSeriesData: processTimeSeriesData(filteredIncidents),
      locationData: processLocationData(filteredIncidents),
      facilityData: processFacilityData(filteredIncidents, false),
      assigneeData: processAssigneeData(filteredIncidents),
      heatmapData: processHeatmapData(filteredIncidents),
      riskData: processRiskData(filteredIncidents)
    };
  }, [filteredIncidents]);
  
  // Calculate role distribution data for charts
  const roleDistributionData = useMemo(() => {
    // Extract roles from people involved in filtered incidents
    const roles = filteredIncidents.flatMap(incident => 
      incident.peopleInvolved?.map(person => person.role) || []
    );
    
    // Count the occurrences of each role
    const roleCounts = roles.reduce((acc, role) => {
      if (!role) return acc;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to the expected format
    return Object.entries(roleCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredIncidents]);
  
  // Handle filter changes
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range,
      dateFilter: range?.from ? 'custom' : prev.dateFilter
    }));
  };
  
  return {
    facilities,
    isAdmin: false,
    filters,
    handleFilterChange,
    handleDateRangeChange,
    filteredIncidents,
    availableSubcategories,
    peopleInvolved,
    chartData,
    roleDistributionData,
    isLoading
  };
};
