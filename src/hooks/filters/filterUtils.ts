
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';

// Apply filters to incidents
export function applyFilters(incidents: Incident[], filters: FilterState): Incident[] {
  const filtered = incidents.filter(incident => {
    // Filter by type
    if (filters.type && incident.type !== filters.type) return false;
    
    // Filter by category
    if (filters.category && incident.category !== filters.category) return false;
    
    // Filter by subcategory
    if (filters.subcategory && incident.subcategory !== filters.subcategory) return false;
    
    // Filter by status
    if (filters.status && incident.status !== filters.status) return false;
    
    // Filter by priority
    if (filters.priority && incident.priority !== filters.priority) return false;
    
    // Filter by location
    if (filters.location && incident.location !== filters.location) return false;
    
    // Filter by facility
    if (filters.facility && incident.facility !== filters.facility) return false;
    
    // Filter by owner
    if (filters.owner && (!incident.owner || incident.owner.id !== filters.owner)) return false;
    
    // Filter voided incidents
    if (filters.isVoided && !incident.isVoided) return false;
    
    // Filter reopened incidents
    if (filters.wasReopened && !incident.wasReopened) return false;
    
    // Filter by attachments
    if (filters.hasAttachments) {
      const hasAttachments = Boolean(
        incident.image || 
        incident.video || 
        incident.document || 
        (incident.documents && incident.documents.length > 0)
      );
      if (!hasAttachments) return false;
    }
    
    // Filter by people involved role
    if (filters.involvedRole && !incident.peopleInvolved.some(person => person.role === filters.involvedRole)) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      const incidentDate = new Date(incident.date);
      if (incidentDate < dateFrom) return false;
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      // Set time to end of day
      dateTo.setHours(23, 59, 59, 999);
      const incidentDate = new Date(incident.date);
      if (incidentDate > dateTo) return false;
    }
    
    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      // Search in ticket ID
      if (incident.ticketId.toLowerCase().includes(searchLower)) return true;
      // Search in description
      if (incident.description.toLowerCase().includes(searchLower)) return true;
      // Search in category
      if (incident.category.toLowerCase().includes(searchLower)) return true;
      // Search in subcategory
      if (incident.subcategory && incident.subcategory.toLowerCase().includes(searchLower)) return true;
      // Search in people involved
      if (incident.peopleInvolved.some(p => 
        p.name.toLowerCase().includes(searchLower) || 
        (p.notes && p.notes.toLowerCase().includes(searchLower))
      )) return true;
      
      return false;
    }
    
    return true;
  });
  
  // Sort by newest first
  return [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get initial filter state
export const getInitialFilterState = (): FilterState => ({
  type: '',
  category: '',
  subcategory: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  search: '',
  priority: '',
  location: '',
  facility: '',
  owner: '',
  isVoided: false,
  wasReopened: false,
  hasAttachments: false,
  involvedRole: '',
  showAdvancedFilters: false
});
