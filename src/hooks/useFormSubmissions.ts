
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

export const useFormSubmissions = (formId: string | null, clientId?: string | null) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    // If neither is provided, clear and exit
    if (!formId && !clientId) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body: any = {};
      if (formId) body.form_id = formId;
      else if (clientId) body.client_id = clientId;

      const { data, error } = await supabase.functions.invoke('fetch-form-submissions', {
        body
      });

      if (error) {
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
  }, [formId, clientId]);

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions
  };
};
