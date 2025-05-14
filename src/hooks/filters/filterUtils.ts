
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';

// Initial filter state
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
  showClosedIncidents: true,
});

// Apply filters to incidents array
export const applyFilters = (incidents: Incident[], filters: FilterState): Incident[] => {
  return incidents.filter(incident => {
    // Basic text search
    if (filters.search && !matchesSearch(incident, filters.search)) {
      return false;
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
    if (filters.owner && (!incident.owner || incident.owner.id !== filters.owner)) {
      return false;
    }

    // Reporter filter
    if (filters.reportedBy && incident.reportedBy.id !== filters.reportedBy) {
      return false;
    }

    // Date range filter
    if (filters.startDate && new Date(incident.date) < filters.startDate) {
      return false;
    }
    if (filters.endDate && new Date(incident.date) > filters.endDate) {
      return false;
    }

    // If show closed incidents is false, don't show closed incidents
    if (!filters.showClosedIncidents && incident.status === 'Closed') {
      return false;
    }

    return true;
  });
};

// Helper function to match search text in multiple fields
const matchesSearch = (incident: Incident, search: string): boolean => {
  const searchLower = search.toLowerCase();
  
  // Check main fields
  if (incident.ticketId.toLowerCase().includes(searchLower)) return true;
  if (incident.type.toLowerCase().includes(searchLower)) return true;
  if (incident.category.toLowerCase().includes(searchLower)) return true;
  if (incident.subcategory.toLowerCase().includes(searchLower)) return true;
  if (incident.description.toLowerCase().includes(searchLower)) return true;
  if (incident.location.toLowerCase().includes(searchLower)) return true;
  if (incident.status.toLowerCase().includes(searchLower)) return true;
  if (incident.reportedBy.name.toLowerCase().includes(searchLower)) return true;
  if (incident.owner?.name.toLowerCase().includes(searchLower)) return true;
  if (incident.facility?.toLowerCase().includes(searchLower)) return true;

  // Check people involved
  if (incident.peopleInvolved.some(person => 
    person.name.toLowerCase().includes(searchLower) || 
    person.role.toLowerCase().includes(searchLower)
  )) {
    return true;
  }

  return false;
};
