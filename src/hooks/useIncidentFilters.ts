
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
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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
    handleFilterChange,
    clearFilters
  };
}
