
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Priority {
  id: string;
  name: string;
  color?: string;
  weight?: number;
}

export const usePriorities = () => {
  const [priorities, setPriorities] = useState<Priority[]>([
    { id: 'Low', name: 'Low' },
    { id: 'Medium', name: 'Medium' },
    { id: 'High', name: 'High' },
    { id: 'Critical', name: 'Critical' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('incident_priorities')
          .select('id, name, color, weight')
          .order('weight', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Map the data from the database
          setPriorities(data.map(priority => ({
            id: priority.name,
            name: priority.name,
            color: priority.color,
            weight: priority.weight
          })));
        }
      } catch (error) {
        console.error('Error fetching priorities:', error);
        // Fallback to default priorities if fetch fails
        setPriorities([
          { id: 'Low', name: 'Low' },
          { id: 'Medium', name: 'Medium' },
          { id: 'High', name: 'High' },
          { id: 'Critical', name: 'Critical' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, []);

  return { priorities, loading };
};
