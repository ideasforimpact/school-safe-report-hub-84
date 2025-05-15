
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Priority {
  id: string;
  name: string;
  description?: string;
  color?: string;
  weight?: number;
  is_active: boolean;
}

export function usePriorities() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPriorities() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('incident_priorities')
          .select('*')
          .eq('is_active', true)
          .order('weight', { ascending: true });

        if (error) throw error;
        
        setPriorities(data || []);
      } catch (err: any) {
        console.error("Error fetching priorities:", err);
        setError(err.message);
        toast.error("Failed to load priorities");
      } finally {
        setLoading(false);
      }
    }

    fetchPriorities();
  }, []);

  return { priorities, loading, error };
}
