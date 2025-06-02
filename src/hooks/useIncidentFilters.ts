
import { useState, useMemo } from 'react';
import { Incident } from '@/types/incident';

export interface IncidentFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
  subcategory: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  showAdvanced: boolean;
}

export const useIncidentFilters = (incidents: Incident[]) => {
  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    status: '', // Empty string means show all statuses including closed
    priority: '',
    category: '',
    subcategory: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    showAdvanced: false
  });

  // Extract unique values for filter options
  const availableCategories = useMemo(() => {
    const categories = incidents.map(incident => incident.category).filter(Boolean);
    return [...new Set(categories)].sort();
  }, [incidents]);

  const availableSubcategories = useMemo(() => {
    const subcategories = incidents.map(incident => incident.subcategory).filter(Boolean);
    return [...new Set(subcategories)].sort();
  }, [incidents]);

  const availableLocations = useMemo(() => {
    const locations = incidents.map(incident => incident.location).filter(Boolean);
    return [...new Set(locations)].sort();
  }, [incidents]);

  const availableFacilities = useMemo(() => {
    const facilities = incidents.map(incident => incident.facility).filter(Boolean);
    return [...new Set(facilities)].sort();
  }, [incidents]);

  const availableOwners = useMemo(() => {
    const owners = incidents.map(incident => incident.owner).filter(Boolean);
    return [...new Set(owners.map(owner => ({ id: owner.id, name: owner.name })))];
  }, [incidents]);

  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['New', 'Open', 'In Progress', 'Closed', 'On Hold']; // Include all statuses
  const locationOptions = availableLocations;

  // Filter incidents based on current filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          incident.ticketId,
          incident.description,
          incident.category,
          incident.subcategory,
          incident.location,
          incident.reportedBy?.name,
          incident.owner?.name
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter - empty means show all including closed
      if (filters.status && incident.status !== filters.status) return false;

      // Priority filter
      if (filters.priority && incident.priority !== filters.priority) return false;

      // Category filter
      if (filters.category && incident.category !== filters.category) return false;

      // Subcategory filter
      if (filters.subcategory && incident.subcategory !== filters.subcategory) return false;

      // Location filter
      if (filters.location && incident.location !== filters.location) return false;

      // Date range filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const incidentDate = new Date(incident.date);
        if (incidentDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        const incidentDate = new Date(incident.date);
        if (incidentDate > toDate) return false;
      }

      return true;
    });
  }, [incidents, filters]);

  const handleFilterChange = (field: keyof IncidentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAdvancedFilters = () => {
    setFilters(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '', // Reset to show all statuses
      priority: '',
      category: '',
      subcategory: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      showAdvanced: false
    });
  };

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
