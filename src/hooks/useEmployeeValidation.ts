
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

/**
 * Custom hook to validate employee access on page loads and visibility changes.
 * Will redirect to login page if validation fails.
 */
export const useEmployeeValidation = () => {
  const { employeeData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastValidationRef = useRef<number>(Date.now());
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if the current path is a backoffice path
  const isBackofficePath = () => {
    return location.pathname.startsWith('/backoffice');
  };

  // Function to validate the employee
  const validateEmployee = async () => {
    // Skip validation for backoffice paths
    if (isBackofficePath()) {
      return;
    }
    
    // Skip if no employee data
    if (!employeeData?.id || !employeeData?.clientId) {
      return;
    }
    
    try {
      // Call the validate-employee edge function
      const { data, error } = await supabase.functions.invoke('validate-employee', {
        body: {
          employeeId: employeeData.id,
          clientId: employeeData.clientId
        }
      });
      
      // If validation fails, log out and redirect to login page
      if (error || !data?.valid) {
        console.error('Employee validation failed:', error?.message || data?.message);
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      }
      
      // Update last validation timestamp
      lastValidationRef.current = Date.now();
      
    } catch (error) {
      console.error('Error during employee validation:', error);
    }
  };

  // Effect to set up validation on page loads and visibility changes
  useEffect(() => {
    // Skip for backoffice paths
    if (isBackofficePath()) {
      return;
    }
    
    // Function to handle page visibility changes
    const handleVisibilityChange = () => {
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
    validationTimeoutRef.current = setInterval(validateEmployee, 30 * 60 * 1000);
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      if (validationTimeoutRef.current) {
        clearInterval(validationTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [employeeData, location.pathname]);

  return { validateEmployee };
};
