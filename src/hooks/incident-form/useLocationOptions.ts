
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';

interface LocationOption {
  value: string;
  label: string;
}

export function useLocationOptions(locationId: string) {
  const { locations, facilities } = useIncidents();
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<LocationOption[]>([]);

  // Transform locations to options format
  useEffect(() => {
    const options = locations.map(location => ({
      value: location.id,
      label: location.name
    }));
    
    setLocationOptions(options);
  }, [locations]);

  // Update facility options when location changes
  useEffect(() => {
    if (!locationId) {
      setFacilityOptions([]);
      return;
    }

    const options = facilities.map(facility => ({
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
