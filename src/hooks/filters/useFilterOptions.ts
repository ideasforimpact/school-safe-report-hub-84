
import { useState, useEffect } from 'react';
import { Incident } from '@/types/incident';
import { FilterState } from '@/types/filterTypes';
import { 
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories 
} from '@/contexts/IncidentContext';

export function useFilterOptions(incidents: Incident[], filters: FilterState) {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<string[]>([]);
  const [availableOwners, setAvailableOwners] = useState<{id: string, name: string}[]>([]);

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

  return {
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners
  };
}
