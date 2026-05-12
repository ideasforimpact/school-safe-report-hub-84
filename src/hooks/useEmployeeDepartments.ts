import { useState, useEffect } from 'react';
import {
  fetchEmployeeDepartmentsShared,
  type EmployeeDepartmentOption,
} from '@/services/employee/employeeReferenceDataShared';

export type { EmployeeDepartmentOption };

export function useEmployeeDepartments(enabled: boolean = true) {
  const [employeeDepartments, setEmployeeDepartments] = useState<EmployeeDepartmentOption[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEmployeeDepartments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEmployeeDepartmentsShared();
        if (!cancelled) {
          setEmployeeDepartments(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching employee departments:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch employee departments');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { employeeDepartments, loading, error };
}


