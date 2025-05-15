
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubcategoryItem {
  id: string;
  name: string;
  categoryId?: string;
}

export const useSubcategories = (categoryId: string) => {
  const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!categoryId) {
        setAvailableSubcategories([]);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('incident_subcategories')
          .select('id, name')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setAvailableSubcategories(data);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setAvailableSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  return { availableSubcategories, loading };
};
