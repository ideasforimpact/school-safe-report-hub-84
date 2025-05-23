
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { priorityService, PriorityItem } from '@/services/incident/priorityService';

// Default priorities to use as fallback
const DEFAULT_PRIORITIES: PriorityItem[] = [
  { id: '1', name: 'Low', description: 'Low priority', color: '#10B981', weight: 1, is_active: true },
  { id: '2', name: 'Medium', description: 'Medium priority', color: '#F59E0B', weight: 2, is_active: true },
  { id: '3', name: 'High', description: 'High priority', color: '#EF4444', weight: 3, is_active: true }
];

export function usePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>(DEFAULT_PRIORITIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeData } = useAuth();

  useEffect(() => {
    async function fetchPriorities() {
      try {
        setLoading(true);
        setError(null);
        
        if (!employeeData?.clientId) {
          console.warn('Client ID not available for fetching priorities');
          setPriorities(DEFAULT_PRIORITIES);
          return;
        }
        
        const data = await priorityService.getPriorities(employeeData.clientId, true);
        
        if (data && data.length > 0) {
          setPriorities(data);
        } else {
          console.warn('No priorities found in database, using defaults');
          setPriorities(DEFAULT_PRIORITIES);
        }
      } catch (err: any) {
        console.error("Error fetching priorities:", err);
        setError(err.message);
        setPriorities(DEFAULT_PRIORITIES);
      } finally {
        setLoading(false);
      }
    }

    fetchPriorities();
  }, [employeeData?.clientId]);

  return { priorities, loading, error };
}
