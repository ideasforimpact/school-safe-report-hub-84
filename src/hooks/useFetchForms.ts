
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
        console.log('No client ID available, user may not be logged in yet');
        setError('Please log in to view forms');
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
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeForms = async () => {
      // Wait for auth session to be initialized
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session check:', session ? 'Session found' : 'No session');
        
        if (isMounted) {
          // Check if we have employee data from Redux store
          const clientId = employeeData?.clientId || getClientId();
          
          if (clientId) {
            // If we have client ID, fetch immediately
            fetchForms();
          } else {
            // Wait a bit more for employee data to load
            timeoutId = setTimeout(() => {
              if (isMounted) {
                fetchForms();
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        if (isMounted) {
          // Still try to fetch forms even if session check fails
          timeoutId = setTimeout(() => {
            if (isMounted) {
              fetchForms();
            }
          }, 500);
        }
      }
    };

    initializeForms();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Delay to ensure contexts and Redux store are updated
        timeoutId = setTimeout(() => {
          if (isMounted) {
            fetchForms();
          }
        }, 600);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setForms([]);
          setError('Please log in to view forms');
          setLoading(false);
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
  }, []);

  // Watch for changes in employee data from Redux store
  useEffect(() => {
    if (employeeData?.clientId) {
      console.log('Employee data available, fetching forms');
      fetchForms();
    }
  }, [employeeData?.clientId]);

  return {
    forms,
    loading,
    error,
    refetch: fetchForms
  };
};
