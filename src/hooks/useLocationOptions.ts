
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocationOption {
  id: string;
  name: string;
}

export const useLocationOptions = (locationId?: string) => {
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        
        // Fetch location data
        const { data: locations, error: locationsError } = await supabase
          .from('campuses')
          .select('id, name')
          .order('name');
          
        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
          return;
        }
        
        if (locations) {
          setLocationOptions(locations.map(loc => ({
            id: loc.id,
            name: loc.name
          })));
        }

        // If locationId is provided, fetch facilities for that location
        if (locationId) {
          fetchFacilities(locationId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useLocationOptions:', error);
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const fetchFacilities = async (campusId: string) => {
    try {
      setLoading(true);
      
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('campus_id', campusId)
        .order('name');
        
      if (facilitiesError) {
        console.error('Error fetching facilities:', facilitiesError);
        return;
      }
      
      if (facilities) {
        setFacilityOptions(facilities.map(fac => ({
          id: fac.id,
          name: fac.name
        })));
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchFacilities(locationId);
    } else {
      setFacilityOptions([]);
    }
  }, [locationId]);

  return { locationOptions, facilityOptions, loading };
};
