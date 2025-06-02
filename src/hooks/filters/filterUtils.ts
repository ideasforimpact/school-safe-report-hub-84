
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';

export const getInitialFilterState = (): FilterState => ({
  search: '',
  type: '',
  category: '',
  subcategory: '',
  status: '',
  priority: '',
  location: '',
  facility: '',
  owner: '',
  reportedBy: '',
  startDate: null,
  endDate: null,
  showAdvancedFilters: false,
  showClosedIncidents: false,
  isVoided: false,
  wasReopened: false,
  hasAttachments: false,
  involvedRole: '',
  dateFrom: '',
  dateTo: ''
});

export const applyFilters = (incidents: Incident[], filters: FilterState): Incident[] => {
  return incidents.filter(incident => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchMatch = 
        incident.ticketId.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        incident.category.toLowerCase().includes(searchTerm) ||
        incident.subcategory.toLowerCase().includes(searchTerm);
      
      if (!searchMatch) return false;
    }

    // Type filter
    if (filters.type && incident.type !== filters.type) {
      return false;
    }

    // Category filter
    if (filters.category && incident.category !== filters.category) {
      return false;
    }

    // Subcategory filter
    if (filters.subcategory && incident.subcategory !== filters.subcategory) {
      return false;
    }

    // Status filter
    if (filters.status && incident.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority && incident.priority !== filters.priority) {
      return false;
    }

    // Location filter
    if (filters.location && incident.location !== filters.location) {
      return false;
    }

    // Facility filter
    if (filters.facility && incident.facility !== filters.facility) {
      return false;
    }

    // Owner filter
    if (filters.owner && (!incident.owner || incident.owner.name !== filters.owner)) {
      return false;
    }

    // Reported by filter
    if (filters.reportedBy && incident.reportedBy.name !== filters.reportedBy) {
      return false;
    }

    // Date range filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (incident.date < fromDate) return false;
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (incident.date > toDate) return false;
    }

    // Advanced filters
    if (!filters.showClosedIncidents && incident.status === 'Closed') {
      return false;
    }

    if (filters.isVoided && !incident.isVoided) {
      return false;
    }

    if (filters.wasReopened && !incident.wasReopened) {
      return false;
    }

    return true;
  });
};
