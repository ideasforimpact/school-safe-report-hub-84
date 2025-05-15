
import { useState, useEffect } from 'react';
import { SubcategoryItem } from '@/contexts/types';
import { supabase } from '@/integrations/supabase/client';

export const useSubcategories = (categoryId: string) => {
  const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!categoryId) {
        setAvailableSubcategories([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch subcategories from Supabase
        const { data, error } = await supabase
          .from('incident_subcategories')
          .select('id, name')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          console.error('Error fetching subcategories:', error);
          return;
        }
        
        if (data) {
          setAvailableSubcategories(data.map(subcat => ({
            id: subcat.id,
            name: subcat.name
          })));
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  return {
    availableSubcategories,
    loading
  };
};
