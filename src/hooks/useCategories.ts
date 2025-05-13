
import { useState, useEffect } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { IncidentCategory } from '@/types/supabase';

export function useCategories() {
  const { client } = useClient();
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      if (!client?.id) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('incident_categories')
          .select('*')
          .eq('client_id', client.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        if (isMounted) {
          setCategories(data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [client?.id]);

  const addCategory = async (name: string, description?: string): Promise<IncidentCategory | null> => {
    if (!client?.id) return null;

    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .insert({
          client_id: client.id,
          name,
          description: description || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<IncidentCategory>): Promise<IncidentCategory | null> => {
    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      // Option 1: Hard delete
      const { error } = await supabase
        .from('incident_categories')
        .delete()
        .eq('id', id);

      // Option 2: Soft delete (uncomment to use this instead)
      // const { error } = await supabase
      //  .from('incident_categories')
      //  .update({ is_active: false })
      //  .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
