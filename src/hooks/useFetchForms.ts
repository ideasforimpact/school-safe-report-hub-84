
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';

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
  const [authReady, setAuthReady] = useState(false);
  
  const { getClientId } = useEmployeeAccess();

  // Check if auth is ready
  useEffect(() => {
    let mounted = true;

    const checkAuthReady = async () => {
      try {
        // Wait for the session to be properly loaded
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setAuthReady(true);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        if (mounted) {
          setAuthReady(true); // Allow it to proceed even if there's an error
        }
      }
    };

    // Small delay to ensure auth context is initialized
    const timer = setTimeout(checkAuthReady, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const fetchForms = async () => {
    if (!authReady) {
      console.log('Auth not ready yet, skipping form fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const clientId = getClientId();
      
      if (!clientId) {
        console.log('No client ID available, user may not be logged in yet');
        setError('Please log in to view forms');
        return;
      }

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
    if (authReady) {
      fetchForms();
    }
  }, [authReady]);

  return {
    forms,
    loading,
    error,
    refetch: fetchForms
  };
};
