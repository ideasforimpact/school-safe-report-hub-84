
import { useState, useMemo } from 'react';
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';

export const useIncidentFilters = (incidents: Incident[]) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    category: '',
    subcategory: '',
    status: '', // Empty string means show all statuses including closed
    priority: '',
    location: '',
    facility: '',
    owner: '',
    reportedBy: '',
    startDate: null,
    endDate: null,
    showAdvancedFilters: false,
    showClosedIncidents: true,
    isVoided: false,
    wasReopened: false,
    hasAttachments: false,
    involvedRole: '',
    dateFrom: '',
    dateTo: ''
  });

  // Extract unique values for filter options from actual incident data
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
    const owners = incidents
      .map(incident => incident.owner)
      .filter(Boolean)
      .map(owner => ({ id: owner!.id, name: owner!.name }));
    return [...new Set(owners.map(owner => JSON.stringify(owner)))].map(str => JSON.parse(str));
  }, [incidents]);

  // Extract status options from incidents data
  const statusOptions = useMemo(() => {
    const statuses = incidents.map(incident => incident.status).filter(Boolean);
    return [...new Set(statuses)].sort();
  }, [incidents]);

  // Extract priority options from incidents data
  const priorityOptions = useMemo(() => {
    const priorities = incidents.map(incident => incident.priority).filter(Boolean);
    return [...new Set(priorities)].sort();
  }, [incidents]);

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
        ].filter(Boolean).join(' ').toLowerCase();
        
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

      // Facility filter
      if (filters.facility && incident.facility !== filters.facility) return false;

      // Owner filter
      if (filters.owner && incident.owner?.name !== filters.owner) return false;

      // Date range filter using dateFrom and dateTo
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

      // Date range filter using startDate and endDate (alternative date filtering)
      if (filters.startDate) {
        const incidentDate = new Date(incident.date);
        if (incidentDate < filters.startDate) return false;
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        const incidentDate = new Date(incident.date);
        if (incidentDate > endDate) return false;
      }

      return true;
    });
  }, [incidents, filters]);

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAdvancedFilters = () => {
    setFilters(prev => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      subcategory: '',
      status: '', // Reset to show all statuses
      priority: '',
      location: '',
      facility: '',
      owner: '',
      reportedBy: '',
      startDate: null,
      endDate: null,
      showAdvancedFilters: false,
      showClosedIncidents: true,
      isVoided: false,
      wasReopened: false,
      hasAttachments: false,
      involvedRole: '',
      dateFrom: '',
      dateTo: ''
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
