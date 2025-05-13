
import { useMemo, useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth';
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
  const { incidents } = useIncidents();
  const { users, isAdmin } = useAuth();
  
  // Get facilities with error handling in case the context is not available
  let facilities = [];
  try {
    const facilityContext = useFacilities();
    facilities = facilityContext.facilities;
  } catch (error) {
    console.warn('Facility context not available:', error);
    // Set default facilities if context is not available
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
      isAdmin
    );
  }, [incidents, filters, isAdmin]);
  
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
      facilityData: processFacilityData(filteredIncidents, isAdmin),
      assigneeData: processAssigneeData(filteredIncidents),
      heatmapData: processHeatmapData(filteredIncidents),
      riskData: processRiskData(filteredIncidents)
    };
  }, [filteredIncidents, isAdmin]);
  
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
    roleDistributionData
  };
};
