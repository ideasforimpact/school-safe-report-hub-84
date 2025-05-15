
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryItem {
  id: string;
  name: string;
}

export const useIncidentCategories = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('incident_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to empty categories if fetch fails
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};
