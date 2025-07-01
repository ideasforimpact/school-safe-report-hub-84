
import { useState, useEffect } from 'react';
import { priorityService, PriorityItem } from '@/services/incident/priorityService';

export function usePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // RLS handles client filtering automatically - no need for manual client checks
      const data = await priorityService.getPriorities(true);
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
  }, []);

  return { priorities, loading, error, refetch: fetchPriorities };
}
