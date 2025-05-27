
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
}

interface CustomForm {
  id: string;
  client_id: string;
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  submissions_count: number;
}

// Database type for Supabase operations
interface DatabaseCustomForm {
  id?: string;
  client_id: string;
  title: string;
  description?: string;
  fields: any; // JSON in database
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  submissions_count?: number;
}

export const useCustomForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to our interface
      const transformedForms: CustomForm[] = (data || []).map(form => ({
        ...form,
        fields: Array.isArray(form.fields) ? form.fields : []
      }));
      
      setForms(transformedForms);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async (formData: Omit<CustomForm, 'id' | 'created_at' | 'updated_at' | 'submissions_count'>) => {
    try {
      // Transform to database format
      const dbFormData: Omit<DatabaseCustomForm, 'id' | 'created_at' | 'updated_at' | 'submissions_count'> = {
        client_id: formData.client_id,
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        is_active: formData.is_active,
        created_by: formData.created_by
      };

      const { data, error } = await supabase
        .from('custom_forms')
        .insert([dbFormData])
        .select()
        .single();

      if (error) throw error;
      await fetchForms(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error saving form:', err);
      throw err;
    }
  };

  const updateForm = async (id: string, formData: Partial<CustomForm>) => {
    try {
      // Transform to database format
      const dbFormData: Partial<DatabaseCustomForm> = {
        ...formData,
        fields: formData.fields ? formData.fields : undefined
      };

      const { data, error } = await supabase
        .from('custom_forms')
        .update(dbFormData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchForms(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating form:', err);
      throw err;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchForms(); // Refresh the list
    } catch (err) {
      console.error('Error deleting form:', err);
      throw err;
    }
  };

  const toggleFormActive = async (id: string, isActive: boolean) => {
    try {
      await updateForm(id, { is_active: isActive });
    } catch (err) {
      console.error('Error toggling form active status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return {
    forms,
    loading,
    error,
    saveForm,
    updateForm,
    deleteForm,
    toggleFormActive,
    refetch: fetchForms
  };
};
