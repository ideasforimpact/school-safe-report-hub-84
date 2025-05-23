
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { priorityService, PriorityItem } from '@/services/incident/priorityService';

export function usePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeData } = useAuth();

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!employeeData?.clientId) {
        console.warn('Client ID not available for fetching priorities');
        setPriorities([]);
        return;
      }
      
      const data = await priorityService.getPriorities(employeeData.clientId, true);
      setPriorities(data || []);
    } catch (err: any) {
      console.error("Error fetching priorities:", err);
      setError(err.message);
      setPriorities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, [employeeData?.clientId]);

  return { priorities, loading, error, refetch: fetchPriorities };
}
