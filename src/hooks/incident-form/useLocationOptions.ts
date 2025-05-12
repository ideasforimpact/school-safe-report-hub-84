
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident';

interface LocationOption {
  value: string;
  label: string;
}

export function useLocationOptions(locationId: string) {
  const { locations, facilities } = useIncidents();
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<LocationOption[]>([]);

  useEffect(() => {
    // Transform locations data to options format
    const options = locations.map(location => ({
      value: location.id,
      label: location.name
    }));
    
    setLocationOptions(options);
  }, [locations]);

  useEffect(() => {
    // Filter facilities based on selected location
    // In a real app, you would use the locationId to filter facilities
    // For now, we'll just show all facilities
    const options = facilities.map(facility => ({
      value: facility.id,
      label: facility.name
    }));
    
    setFacilityOptions(options);
  }, [facilities, locationId]);

  return {
    locationOptions,
    facilityOptions
  };
}
