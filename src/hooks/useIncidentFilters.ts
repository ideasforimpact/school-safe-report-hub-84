
import { useState, useEffect } from 'react';
import { Incident } from '@/types/incident';
import { 
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories 
} from '@/contexts/IncidentContext';

export interface FilterState {
  type: string;
  category: string;
  subcategory: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  priority: string;
  location: string;
  facility: string;
  owner: string;
  isVoided: boolean;
  wasReopened: boolean;
  hasAttachments: boolean;
  involvedRole: string;
  showAdvancedFilters: boolean;
}

export function useIncidentFilters(incidents: Incident[]) {
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
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

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<string[]>([]);
  const [availableOwners, setAvailableOwners] = useState<{id: string, name: string}[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(incidents);

  // Update available categories when type changes
  useEffect(() => {
    if (!filters.type) {
      setAvailableCategories([]);
      return;
    }

    if (filters.type === 'Incident') {
      setAvailableCategories(Object.keys(subcategories));
    } else if (filters.type === 'Near Miss') {
      setAvailableCategories(Object.keys(nearMissSubcategories));
    } else if (filters.type === 'Unsafe Condition') {
      setAvailableCategories(Object.keys(unsafeConditionSubcategories));
    } else {
      setAvailableCategories([]);
    }
  }, [filters.type]);

  // Update available subcategories when type or category changes
  useEffect(() => {
    if (!filters.type || !filters.category) {
      setAvailableSubcategories([]);
      return;
    }

    if (filters.type === 'Incident') {
      setAvailableSubcategories(subcategories[filters.category as keyof typeof subcategories] || []);
    } else if (filters.type === 'Near Miss') {
      setAvailableSubcategories(nearMissSubcategories[filters.category] || []);
    } else if (filters.type === 'Unsafe Condition') {
      setAvailableSubcategories(unsafeConditionSubcategories[filters.category] || []);
    } else {
      setAvailableSubcategories([]);
    }
  }, [filters.type, filters.category]);

  // Extract unique locations from incidents
  useEffect(() => {
    const locations = new Set<string>();
    
    incidents.forEach(incident => {
      if (incident.location) {
        locations.add(incident.location);
      }
    });
    
    setAvailableLocations(Array.from(locations));
  }, [incidents]);

  // Extract unique facilities from incidents based on selected location
  useEffect(() => {
    const facilities = new Set<string>();
    
    incidents.forEach(incident => {
      if ((!filters.location || incident.location === filters.location) && incident.facility) {
        facilities.add(incident.facility);
      }
    });
    
    setAvailableFacilities(Array.from(facilities));
  }, [incidents, filters.location]);

  // Extract unique owners from incidents
  useEffect(() => {
    const ownersMap = new Map<string, {id: string, name: string}>();
    
    incidents.forEach(incident => {
      if (incident.owner) {
        ownersMap.set(incident.owner.id, incident.owner);
      }
    });
    
    setAvailableOwners(Array.from(ownersMap.values()));
  }, [incidents]);

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
      showAdvancedFilters: filters.showAdvancedFilters
    });
  };

  // Apply filters to incidents
  useEffect(() => {
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
          (incident.documents && incident.documents.length > 0) ||
          (incident.files && incident.files.length > 0)
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
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredIncidents(sorted);
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
