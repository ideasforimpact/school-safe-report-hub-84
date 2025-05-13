
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';
import { ConfigItem } from '@/contexts/types';

interface LocationOption {
  value: string;
  label: string;
}

// Extend the ConfigItem interface to include the locationId property
interface FacilityItem extends ConfigItem {
  locationId?: string;
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

    // Since the ConfigItem type doesn't include locationId,
    // we need to use a more appropriate filter method
    // that doesn't assume all facilities have a locationId
    const filteredFacilities = facilities.filter((facility: any) => {
      // Check if the facility has a locationId property
      return facility.locationId === locationId;
    });

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
