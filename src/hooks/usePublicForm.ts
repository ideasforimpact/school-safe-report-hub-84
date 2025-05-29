
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormField, CustomForm } from '@/types/formTypes';

export const usePublicForm = (formId: string | undefined) => {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicForm = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('custom_forms')
          .select('*')
          .eq('id', formId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching public form:', error);
          setError('Form not found or not active');
          setForm(null);
        } else {
          // Transform database data to our interface
          const transformedForm: CustomForm = {
            ...data,
            fields: Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : []
          };
          setForm(transformedForm);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching public form:', err);
        setError('Failed to load form');
        setForm(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicForm();
  }, [formId]);

  return { form, loading, error };
};
