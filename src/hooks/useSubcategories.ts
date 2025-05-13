
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncidentSubcategory } from '@/types/supabase';

export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<IncidentSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSubcategories = async () => {
      if (!categoryId) {
        setSubcategories([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('incident_subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        if (isMounted) {
          setSubcategories(data || []);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch subcategories'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSubcategories();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const addSubcategory = async (name: string, description?: string): Promise<IncidentSubcategory | null> => {
    if (!categoryId) return null;

    try {
      const { data, error } = await supabase
        .from('incident_subcategories')
        .insert({
          category_id: categoryId,
          name,
          description: description || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setSubcategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding subcategory:', err);
      throw err;
    }
  };

  const updateSubcategory = async (id: string, updates: Partial<IncidentSubcategory>): Promise<IncidentSubcategory | null> => {
    try {
      const { data, error } = await supabase
        .from('incident_subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSubcategories(prev => prev.map(subcat => subcat.id === id ? data : subcat));
      return data;
    } catch (err) {
      console.error('Error updating subcategory:', err);
      throw err;
    }
  };

  const deleteSubcategory = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('incident_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubcategories(prev => prev.filter(subcat => subcat.id !== id));
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      throw err;
    }
  };

  return {
    subcategories,
    loading,
    error,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
