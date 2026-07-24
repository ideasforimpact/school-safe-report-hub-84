
import { useState, useEffect, useCallback } from 'react';
import { priorityService, PriorityItem } from '@/services/incident/priorityService';
import { useAuth } from '@/contexts/auth/useAuth';

export function usePriorities(clientTypeId?: string) {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await priorityService.getPriorities(false, clientTypeId);
      // Sort active priorities to the top
      const sortedPriorities = (data || []).sort((a, b) => {
        // Active items first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        // Then sort by weight (higher weight first)
        return (b.weight || 0) - (a.weight || 0);
      });

      setPriorities(sortedPriorities);
    } catch (err) {
      console.error("Error fetching priorities:", err);
      setError(err instanceof Error ? err.message : String(err));
      setPriorities([]);
    } finally {
      setLoading(false);
    }
  }, [clientTypeId]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  return { priorities, loading, error, refetch: fetchPriorities };
}

// Hook for fetching only active priorities (for forms, dropdowns, etc.)
export function useActivePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { employeeData, user } = useAuth();
  const clientTypeId = employeeData?.clientType?.id ?? user?.clientType?.id ?? undefined;

  const fetchPriorities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await priorityService.getPriorities(true, clientTypeId);
      const sortedPriorities = (data || []).sort((a, b) => (b.weight || 0) - (a.weight || 0));
      setPriorities(sortedPriorities);
    } catch (err) {
      console.error("Error fetching active priorities:", err);
      setError(err instanceof Error ? err.message : String(err));
      setPriorities([]);
    } finally {
      setLoading(false);
    }
  }, [clientTypeId]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  return { priorities, loading, error, refetch: fetchPriorities };
}
