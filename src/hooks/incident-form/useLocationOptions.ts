
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocationOption {
  value: string;
  label: string;
}

export const useLocationOptions = (selectedLocationId: string = '') => {
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('campuses')
          .select('id, name')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setLocationOptions(
            data.map(location => ({
              value: location.id,
              label: location.name
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocationOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Fetch facilities for the selected location
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!selectedLocationId) {
        setFacilityOptions([]);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name')
          .eq('campus_id', selectedLocationId)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setFacilityOptions(
            data.map(facility => ({
              value: facility.id,
              label: facility.name
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        setFacilityOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [selectedLocationId]);

  return { locationOptions, facilityOptions, loading };
};
