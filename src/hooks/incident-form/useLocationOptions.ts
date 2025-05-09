
import { useEffect, useState } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';

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
    if (!locationId) {
      setFacilityOptions([]);
      return;
    }

    // Filter facilities based on selected location
    const filteredFacilities = facilities.filter(facility => 
      facility.locationId === locationId
    );

    // Transform filtered facilities to options format
    const options = filteredFacilities.map(facility => ({
      value: facility.id,
      label: facility.name
    }));
    
    setFacilityOptions(options);
  }, [locationId, facilities]);

  return {
    locationOptions,
    facilityOptions
  };
}
