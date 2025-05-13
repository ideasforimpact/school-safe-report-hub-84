
import { useState, useEffect } from 'react';
import { Incident } from '@/types/incident';
import { FilterState, FilterHookReturn } from '@/types/filterTypes';
import { useFilterOptions } from './useFilterOptions';
import { applyFilters, getInitialFilterState } from './filterUtils';

export function useIncidentFilters(incidents: Incident[]): FilterHookReturn {
  // Filter states
  const [filters, setFilters] = useState<FilterState>(getInitialFilterState());
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(incidents);

  // Get available options for filters
  const {
    categoryOptions: availableCategories,
    locationOptions: availableLocations,
    facilityOptions: availableFacilities
  } = useFilterOptions();
  
  // Make an empty array for subcategories since they need to be handled separately
  const availableSubcategories: string[] = [];
  
  // Create available owners array from incidents data
  const availableOwners = incidents
    .filter(incident => incident.owner)
    .map(incident => ({ id: incident.owner!.id, name: incident.owner!.name }))
    .filter((owner, index, self) => 
      index === self.findIndex(o => o.id === owner.id)
    );

  // Reset category and subcategory when type changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: '',
      subcategory: ''
    }));
  }, [filters.type]);

  // Reset subcategory when category changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [filters.category]);

  // Reset facility when location changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      facility: ''
    }));
  }, [filters.location]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleAdvancedFilters = () => {
    setFilters(prev => ({ 
      ...prev, 
      showAdvancedFilters: !prev.showAdvancedFilters 
    }));
  };

  const clearFilters = () => {
    setFilters({
      ...getInitialFilterState(),
      showAdvancedFilters: filters.showAdvancedFilters
    });
  };

  // Apply filters to incidents
  useEffect(() => {
    const result = applyFilters(incidents, filters);
    setFilteredIncidents(result);
  }, [incidents, filters]);

  return {
    filters,
    filteredIncidents,
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  };
}
