
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
    
    return facilities
      .filter(facility => facility.locationId === selectedLocationId)
      .map(facility => ({
        value: facility.id,
        label: facility.name
      }));
  }, [facilities, selectedLocationId]);

  return {
    locationOptions,
    facilityOptions
  };
}
