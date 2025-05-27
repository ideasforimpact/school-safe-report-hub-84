
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
}

export const useCustomForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get client_id from context or auth - for now using a default
  // You may want to get this from your auth context or client context
  const getClientId = () => {
    // TODO: Replace with actual client_id from your auth/client context
    return 'default-client-id';
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .eq('client_id', getClientId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to our interface
      const transformedForms: CustomForm[] = (data || []).map(form => ({
        ...form,
        fields: Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : []
      }));
      
      setForms(transformedForms);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async (formData: Omit<CustomForm, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const payload = {
        operation: 'create',
        client_id: getClientId(),
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        is_active: formData.is_active,
        created_by: formData.created_by
      };

      const { data, error } = await supabase.functions.invoke('custom-forms-management', {
        body: payload
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create form');
      }

      await fetchForms(); // Refresh the list
      return data.data;
    } catch (err) {
      console.error('Error saving form:', err);
      throw err;
    }
  };

  const updateForm = async (id: string, formData: Partial<CustomForm>) => {
    try {
      const payload = {
        operation: 'update',
        formId: id,
        client_id: getClientId(),
        ...formData
      };

      const { data, error } = await supabase.functions.invoke('custom-forms-management', {
        body: payload
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update form');
      }

      await fetchForms(); // Refresh the list
      return data.data;
    } catch (err) {
      console.error('Error updating form:', err);
      throw err;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const payload = {
        operation: 'delete',
        formId: id,
        client_id: getClientId()
      };

      const { data, error } = await supabase.functions.invoke('custom-forms-management', {
        body: payload
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete form');
      }

      await fetchForms(); // Refresh the list
    } catch (err) {
      console.error('Error deleting form:', err);
      throw err;
    }
  };

  const toggleFormActive = async (id: string, isActive: boolean) => {
    try {
      const payload = {
        operation: isActive ? 'activate' : 'deactivate',
        formId: id,
        client_id: getClientId()
      };

      const { data, error } = await supabase.functions.invoke('custom-forms-management', {
        body: payload
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle form status');
      }

      await fetchForms(); // Refresh the list
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
