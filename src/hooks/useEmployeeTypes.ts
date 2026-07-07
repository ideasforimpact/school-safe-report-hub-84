import { useState, useEffect } from 'react';
import {
  fetchEmployeeTypesShared,
  type EmployeeTypeOption,
} from '@/services/employee/employeeReferenceDataShared';

export type { EmployeeTypeOption };

export function useEmployeeTypes(enabled: boolean = true) {
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeOption[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEmployeeTypes([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEmployeeTypesShared();
        if (!cancelled) {
          setEmployeeTypes(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching employee types:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch employee types');
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

  return { employeeTypes, loading, error };
}



