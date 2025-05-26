
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, department')
          .eq('status', true)
          .order('first_name');

        if (error) throw error;
        
        setEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading, error };
};
