
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FormSubmission {
  id: string;
  form_id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  responses: any[];
  status: string;
  comments: string | null;
  acknowledged_by_name?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const useFormSubmissions = (formId: string | null) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!formId) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching submissions for form:', formId);

      const { data, error } = await supabase.functions.invoke('fetch-form-submissions', {
        body: { form_id: formId }
      });

      if (error) {
        console.error('Error calling fetch-form-submissions function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      setSubmissions(data.data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [formId]);

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions
  };
};
