import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VehicleTypeOption } from '@/types/transportSafety';

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicleTypes() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('vehicle_type')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setVehicleTypes(data || []);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicle types');
      } finally {
        setLoading(false);
      }
    }

    fetchVehicleTypes();
  }, []);

  return { vehicleTypes, loading, error };
}

