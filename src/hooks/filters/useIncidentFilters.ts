
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
  const filterOptions = useFilterOptions();
  
  // Extract filter options from filterOptions
  const {
    categoryOptions,
    locationOptions,
    facilityOptions
  } = filterOptions;
  
  // Mock subcategories and owners for the interface compatibility
  const availableSubcategories: string[] = [];
  const availableOwners: {id: string, name: string}[] = [];

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
    availableCategories: categoryOptions,
    availableSubcategories,
    availableLocations: locationOptions,
    availableFacilities: facilityOptions,
    availableOwners,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  };
}
