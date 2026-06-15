
import { useState, useEffect, useRef } from 'react';
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

interface UseFormSubmissionsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useFormSubmissions = (
  formId: string | null,
  clientId?: string | null,
  options?: UseFormSubmissionsOptions
) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<{ pending: number; acknowledged: number; total: number }>({ pending: 0, acknowledged: 0, total: 0 });

  const { page = 1, pageSize = 10, status, dateFrom, dateTo } = options || {};
  const fetchKey = useRef<string>('');

  const fetchSubmissions = async () => {
    if (!formId && !clientId) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body: any = { page, page_size: pageSize };
      if (formId) body.form_id = formId;
      else if (clientId) body.client_id = clientId;

      if (status && status !== 'all') body.status = status;
      if (dateFrom) body.date_from = dateFrom.toISOString();
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        body.date_to = end.toISOString();
      }

      const { data, error } = await supabase.functions.invoke('fetch-form-submissions', { body });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch submissions');

      setSubmissions(data.data || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 0);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = [formId, clientId, page, pageSize, status, dateFrom?.toISOString(), dateTo?.toISOString()].join('|');
    if (key === fetchKey.current) return;
    fetchKey.current = key;
    fetchSubmissions();
  }, [formId, clientId, page, pageSize, status, dateFrom?.toISOString(), dateTo?.toISOString()]);

  return {
    submissions,
    loading,
    error,
    total,
    totalPages,
    stats,
    refetch: fetchSubmissions
  };
};
