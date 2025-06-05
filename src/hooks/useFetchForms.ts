

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';

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

export const useFetchForms = () => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, employeeData } = useAuth();
  const clientId = employeeData?.clientId || user?.clientId;

  const fetchForms = async (clientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching forms for client:', clientId);

      const { data, error } = await supabase.functions.invoke('fetch-forms', {
        body: { client_id: clientId }
      });

      if (error) {
        console.error('Error calling fetch-forms function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch forms');
      }

      setForms(data.data || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only proceed if user is authenticated
    if (!user) {
      setError('Please log in to view forms');
      setLoading(false);
      return;
    }

    if (clientId) {
      console.log('Client ID found, fetching forms:', clientId);
      fetchForms(clientId);
    } else {
      console.log('No client ID available, waiting...');
      setLoading(true);
      setError(null);
    }
  }, [user, clientId]);

  const refetch = () => {
    if (clientId) {
      fetchForms(clientId);
    }
  };

  return {
    forms,
    loading,
    error,
    refetch
  };
};

