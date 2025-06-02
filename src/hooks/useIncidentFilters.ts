
import { useState, useMemo, useCallback } from 'react';
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';
import { getInitialFilterState, applyFilters } from '@/hooks/filters/filterUtils';

export const useIncidentFilters = (incidents: Incident[]) => {
  const [filters, setFilters] = useState<FilterState>(getInitialFilterState());

  // Memoize filter options to prevent recalculation on every render
  const {
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    priorityOptions,
    statusOptions,
    locationOptions
  } = useMemo(() => {
    const categories = [...new Set(incidents.map(i => i.category).filter(Boolean))];
    const subcategories = [...new Set(incidents.map(i => i.subcategory).filter(Boolean))];
    const locations = [...new Set(incidents.map(i => i.location).filter(Boolean))];
    const facilities = [...new Set(incidents.map(i => i.facility).filter(Boolean))];
    const owners = [...new Set(incidents.map(i => i.owner?.name).filter(Boolean))]
      .map(name => ({ id: name, name }));
    const priorities = [...new Set(incidents.map(i => i.priority).filter(Boolean))];
    const statuses = [...new Set(incidents.map(i => i.status).filter(Boolean))];

    return {
      availableCategories: categories,
      availableSubcategories: subcategories,
      availableLocations: locations,
      availableFacilities: facilities,
      availableOwners: owners,
      priorityOptions: priorities,
      statusOptions: statuses,
      locationOptions: locations
    };
  }, [incidents]);

  // Memoize filtered incidents to prevent recalculation
  const filteredIncidents = useMemo(() => {
    return applyFilters(incidents, filters);
  }, [incidents, filters]);

  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const toggleAdvancedFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(getInitialFilterState());
  }, []);

  return {
    filters,
    filteredIncidents,
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    priorityOptions,
    statusOptions,
    locationOptions,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  };
};
