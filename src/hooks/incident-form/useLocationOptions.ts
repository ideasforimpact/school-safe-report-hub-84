
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';
import { ConfigItem } from '@/contexts/types';
import { getAllCampuses } from '@/services/campus/campusService';

interface LocationOption {
  value: string;
  label: string;
}

// Extend the ConfigItem interface to include the locationId property
interface FacilityItem extends ConfigItem {
  locationId?: string;
}

export function useLocationOptions(locationId: string) {
  const { facilities } = useIncidents();
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch locations from the campuses table instead of the context
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const campuses = await getAllCampuses();
        
        const options = campuses.map(campus => ({
          value: campus.id,
          label: campus.name
        }));
        
        setLocationOptions(options);
      } catch (error) {
        console.error("Error fetching campuses:", error);
        setLocationOptions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

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
    facilityOptions,
    loading
  };
}
