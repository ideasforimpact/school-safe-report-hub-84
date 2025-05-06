
import { useMemo, useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
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
  processPeopleData,
  processRoleDistributionData,
  processHeatmapData,
  processRiskData,
  extractUniqueValues,
  PersonDataType
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
  const { facilities } = useFacilities();
  
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
  
  // Active tab state - changed the default from "dashboard" to "charts"
  const [activeTab, setActiveTab] = useState("charts");
  
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
  
  // Prepare people report data
  const peopleData = useMemo(
    () => processPeopleData(filteredIncidents),
    [filteredIncidents]
  );
  
  const roleDistributionData = useMemo(
    () => processRoleDistributionData(peopleData),
    [peopleData]
  );
  
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
    activeTab,
    setActiveTab,
    filters,
    handleFilterChange,
    handleDateRangeChange,
    filteredIncidents,
    availableSubcategories,
    peopleInvolved,
    chartData,
    peopleData,
    roleDistributionData
  };
};
