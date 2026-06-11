import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDepartmentOption {
  id: string;
  department_name: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmployeeDepartments() {
  const [employeeDepartments, setEmployeeDepartments] = useState<EmployeeDepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployeeDepartments() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('employee_departments')
          .select('*')
          .order('department_name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setEmployeeDepartments(data || []);
      } catch (err) {
        console.error('Error fetching employee departments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee departments');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployeeDepartments();
  }, []);

  return { employeeDepartments, loading, error };
}


