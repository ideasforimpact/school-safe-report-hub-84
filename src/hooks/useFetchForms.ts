
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
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
  const [hasFetched, setHasFetched] = useState(false);
  
  const { getClientId } = useEmployeeAccess();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get client ID from Redux store first, then fallback to useEmployeeAccess
      const clientId = employeeData?.clientId || getClientId();
      
      if (!clientId) {
        console.log('No client ID available, waiting for authentication...');
        setLoading(false);
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
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Watch for changes in employee data from Redux store
  useEffect(() => {
    const clientId = employeeData?.clientId || getClientId();
    
    if (clientId && !hasFetched) {
      console.log('Employee data available, fetching forms');
      fetchForms();
    }
  }, [employeeData?.clientId, hasFetched]);

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset hasFetched when user signs in
        setHasFetched(false);
        // Delay to ensure contexts and Redux store are updated
        timeoutId = setTimeout(() => {
          if (isMounted) {
            const clientId = employeeData?.clientId || getClientId();
            if (clientId) {
              fetchForms();
            }
          }
        }, 600);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setForms([]);
          setError(null);
          setLoading(false);
          setHasFetched(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [employeeData?.clientId]);

  // Initial check for existing session
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session check:', session ? 'Session found' : 'No session');
        
        if (isMounted && session) {
          // Check if we have employee data from Redux store
          const clientId = employeeData?.clientId || getClientId();
          
          if (clientId && !hasFetched) {
            // If we have client ID, fetch immediately
            fetchForms();
          } else if (!clientId) {
            // Wait for employee data to load
            timeoutId = setTimeout(() => {
              if (isMounted && !hasFetched) {
                const retryClientId = employeeData?.clientId || getClientId();
                if (retryClientId) {
                  fetchForms();
                } else {
                  setError('Unable to load user data. Please try refreshing the page.');
                  setLoading(false);
                }
              }
            }, 1000);
          }
        } else if (isMounted && !session) {
          setError('Please log in to view forms');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        if (isMounted) {
          setError('Authentication error. Please try refreshing the page.');
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    forms,
    loading,
    error,
    refetch: () => {
      setHasFetched(false);
      fetchForms();
    }
  };
};
