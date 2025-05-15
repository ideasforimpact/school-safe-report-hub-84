
import { useState, useCallback } from 'react';
import { Incident } from '@/types/incident';

export interface FilterState {
  searchTerm: string;
  status: string[];
  priority: string[];
  category: string[];
  startDate: Date | null;
  endDate: Date | null;
  type: string[];
}

export const useIncidentFilters = (incidents: Incident[]) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: [],
    priority: [],
    category: [],
    startDate: null,
    endDate: null,
    type: []
  });

  const filteredIncidents = incidents.filter(incident => {
    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchMatch = 
        incident.ticketId.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        (incident.category && incident.category.toLowerCase().includes(searchTerm));
      
      if (!searchMatch) return false;
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(incident.status)) {
      return false;
    }
    
    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(incident.type)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority.length > 0 && incident.priority && 
        !filters.priority.includes(incident.priority)) {
      return false;
    }
    
    // Category filter
    if (filters.category.length > 0 && 
        !filters.category.includes(incident.category)) {
      return false;
    }
    
    // Date range filter
    if (filters.startDate && new Date(incident.date) < filters.startDate) {
      return false;
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      if (new Date(incident.date) > endDate) {
        return false;
      }
    }
    
    return true;
  });

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: [],
      priority: [],
      category: [],
      startDate: null,
      endDate: null,
      type: []
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredIncidents
  };
};
