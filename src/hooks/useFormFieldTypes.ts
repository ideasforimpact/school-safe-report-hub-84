
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FormFieldType {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useFormFieldTypes = () => {
  const [fieldTypes, setFieldTypes] = useState<FormFieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFieldTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_fields_type')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setFieldTypes(data || []);
    } catch (err) {
      console.error('Error fetching form field types:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldTypes();
  }, []);

  return { fieldTypes, loading, error, refetch: fetchFieldTypes };
};
