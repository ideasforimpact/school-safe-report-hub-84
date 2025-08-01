
import { useMemo, useState, useEffect } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  
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

  // Fetch reference data and incidents for insights
  useEffect(() => {
    const fetchInsightsData = async () => {
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

        // Fetch reference data in parallel
        const [categoriesData, subcategoriesData, reportTypesData, locationsData] = await Promise.all([
          supabase.from('incident_categories').select('*').eq('client_id', clientId),
          supabase.from('incident_subcategories').select('*').eq('client_id', clientId),
          supabase.from('incident_report_types').select('*').eq('client_id', clientId),
          supabase.from('incidents').select('location_id, facility_id').eq('client_id', clientId)
        ]);

        // Set reference data
        setCategories(categoriesData.data || []);
        setSubcategories(subcategoriesData.data || []);
        setReportTypes(reportTypesData.data || []);

        const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;
        const hasIncidentAdmin = employeeState.configuredModules?.find(
          module => module.name.toLowerCase() === 'incidents'
        )?.accessLevel?.is_admin === true;

        // Use the paginated service but get all data for insights
        const response = await incidentDataService.fetchIncidentsForClient(
          clientId, 
          false, 
          employeeDataForFiltering,
          hasIncidentAdmin,
          { page: 1, pageSize: 1000 } // Get a large number for insights
        );

        // Transform incidents to the format expected by insights - now properly mapping the IncidentRecord data
        const transformedIncidents = response.data.map(record => {
          // Get people involved data from the original database record
          let peopleInvolved = [];
          try {
            // For now, we'll create a basic structure since people_involved is stored as JSON in the database
            // but not currently being populated in the incidentDataService query
            peopleInvolved = [];
          } catch (e) {
            console.warn('Failed to parse people_involved for incident:', record.id);
            peopleInvolved = [];
          }

          return {
            id: record.id,
            ticketId: record.ticket_id,
            type: record.type,
            category: record.category,
            subcategory: record.subcategory || '',
            description: record.description,
            date: record.date,
            location: record.location,
            peopleInvolved: peopleInvolved,
            status: record.status,
            reportedBy: { 
              id: record.reportedById || '', 
              name: record.reportedBy || 'Unknown' 
            },
            owner: record.owner ? { 
              id: record.ownerId || '', 
              name: record.owner 
            } : undefined,
            facility: record.facility || '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            priority: record.priority || 'Medium'
          };
        });
        
        setIncidents(transformedIncidents);
        console.log('Insights data fetched successfully:', {
          incidents: transformedIncidents.length,
          categories: categoriesData.data?.length || 0,
          subcategories: subcategoriesData.data?.length || 0,
          reportTypes: reportTypesData.data?.length || 0,
          sampleIncident: transformedIncidents[0] || 'No incidents',
          sampleStatuses: transformedIncidents.slice(0, 3).map(i => i.status),
          samplePriorities: transformedIncidents.slice(0, 3).map(i => i.priority)
        });

      } catch (error) {
        console.error('Error fetching insights data:', error);
        setIncidents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if ((employeeState.employeeData?.clientId || authEmployeeData?.clientId || user?.email) && 
        employeeState.configuredModules) {
      fetchInsightsData();
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

  // Get admin status properly
  const isAdmin = useMemo(() => {
    const incidentModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    return incidentModule?.accessLevel?.is_admin === true;
  }, [employeeState.configuredModules]);
  
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
    isAdmin,
    filters,
    handleFilterChange,
    handleDateRangeChange,
    filteredIncidents,
    availableSubcategories,
    peopleInvolved,
    chartData,
    roleDistributionData,
    isLoading,
    categories,
    subcategories,
    reportTypes,
    locations
  };
};
