
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';

/**
 * Custom hook to validate employee access on page loads and visibility changes.
 * Will redirect to login page if validation fails.
 */
export const useEmployeeValidation = () => {
  const { employeeData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  const lastValidationRef = useRef<number>(Date.now());
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef<boolean>(false);

  // Function to check if the current path is a backoffice path
  const isBackofficePath = () => {
    return location.pathname.startsWith('/backoffice');
  };

  // Function to validate the employee
  const validateEmployee = async () => {
    // Skip validation if logging out
    if (state.isLoggingOut) {
      return;
    }

    // Skip validation for backoffice paths
    if (isBackofficePath()) {
      return;
    }
    
    // Skip if no employee data
    if (!employeeData?.id || !employeeData?.clientId) {
      return;
    }

    // Prevent multiple simultaneous validations
    if (isValidatingRef.current) {
      return;
    }

    isValidatingRef.current = true;
    
    try {
      // Call the validate-employee edge function
      const { data, error } = await supabase.functions.invoke('validate-employee', {
        body: {
          employeeId: employeeData.id,
          clientId: employeeData.clientId
        }
      });
      
      // If validation fails and not already logging out, log out and redirect
      if ((error || !data?.valid) && !state.isLoggingOut) {
        console.error('Employee validation failed:', error?.message || data?.message);
        toast.error('Your session has expired. Please log in again.');
        logout();
      }
      
      // Update last validation timestamp
      lastValidationRef.current = Date.now();
      
    } catch (error) {
      console.error('Error during employee validation:', error);
    } finally {
      isValidatingRef.current = false;
    }
  };

  // Clean up function
  const cleanup = () => {
    if (validationTimeoutRef.current) {
      clearInterval(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
    isValidatingRef.current = false;
  };

  // Effect to set up validation on page loads and visibility changes
  useEffect(() => {
    // Skip for backoffice paths or if logging out
    if (isBackofficePath() || state.isLoggingOut) {
      cleanup();
      return;
    }
    
    // Function to handle page visibility changes
    const handleVisibilityChange = () => {
      if (state.isLoggingOut) {
        return;
      }

      if (document.visibilityState === 'visible') {
        // Only validate if it's been more than 5 minutes since last validation
        const timeSinceLastValidation = Date.now() - lastValidationRef.current;
        if (timeSinceLastValidation > 5 * 60 * 1000) {
          validateEmployee();
        }
      }
    };
    
    // Validate on initial load
    validateEmployee();
    
    // Set up periodic validation (every 30 minutes)
    validationTimeoutRef.current = setInterval(() => {
      if (!state.isLoggingOut) {
        validateEmployee();
      }
    }, 30 * 60 * 1000);
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [employeeData?.id, employeeData?.clientId, location.pathname, state.isLoggingOut]);

  // Clean up when logging out
  useEffect(() => {
    if (state.isLoggingOut) {
      cleanup();
    }
  }, [state.isLoggingOut]);

  return { validateEmployee };
};
