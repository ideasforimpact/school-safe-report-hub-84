import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeTypeOption {
  id: string;
  type_name: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmployeeTypes() {
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployeeTypes() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('employee_type')
          .select('*')
          .order('type_name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setEmployeeTypes(data || []);
      } catch (err) {
        console.error('Error fetching employee types:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee types');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployeeTypes();
  }, []);

  return { employeeTypes, loading, error };
}



