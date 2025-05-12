
import { useMemo } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';

export function useLocationOptions(selectedLocationId: string) {
  const { locations, facilities } = useIncidents();

  // Convert locations to options format for select components
  const locationOptions = useMemo(() => {
    return locations.map(location => ({
      value: location.id,
      label: location.name
    }));
  }, [locations]);

  // Filter facilities based on selected location
  const facilityOptions = useMemo(() => {
    if (!selectedLocationId) return [];
    
    // Since we don't have a direct relationship between locations and facilities in the ConfigItem interface,
    // we'll return all facilities for now
    // In a real application, you would likely have facilities that belong to specific locations
    return facilities.map(facility => ({
      value: facility.id,
      label: facility.name
    }));
  }, [facilities, selectedLocationId]);

  return {
    locationOptions,
    facilityOptions
  };
}
