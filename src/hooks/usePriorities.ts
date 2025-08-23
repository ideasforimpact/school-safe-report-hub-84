
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
      const data = await priorityService.getPriorities(false); // Fetch all priorities (active and inactive)
      
      // Sort active priorities to the top
      const sortedPriorities = (data || []).sort((a, b) => {
        // Active items first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        // Then sort by weight (higher weight first)
        return (b.weight || 0) - (a.weight || 0);
      });
      
      setPriorities(sortedPriorities);
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

// Hook for fetching only active priorities (for forms, dropdowns, etc.)
export function useActivePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // RLS handles client filtering automatically - no need for manual client checks
      const data = await priorityService.getPriorities(true); // Only active priorities
      
      // Sort by weight (higher weight first) for active priorities
      const sortedPriorities = (data || []).sort((a, b) => (b.weight || 0) - (a.weight || 0));
      
      setPriorities(sortedPriorities);
    } catch (err: any) {
      console.error("Error fetching active priorities:", err);
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
