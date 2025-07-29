import { useEffect, useRef } from 'react';
import { validateSession } from '@/utils/sessionValidation';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { clearAuth, setAuthError } from '@/store/authActions';
import { resetEmployee } from '@/store/employeeActions';
import { clearPersistedAuthState } from '@/store/authPersistence';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

// Hook to handle automatic session validation and refresh
export const useSessionRefresh = (intervalMinutes: number = 5) => {
  const { state, dispatch } = useEmployeeStore();
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Don't run session refresh on login pages
    const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
    
    if (!currentUser || isOnLoginRoute) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    const checkSession = async () => {
      console.log('🔄 useSessionRefresh: Checking session validity');
      
      try {
        const isValid = await validateSession();
        
        if (!isValid) {
          console.log('🔄 useSessionRefresh: Session invalid, logging out');
          
          // Clear state
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          
          // Show error message
          toast.error("Your session has expired. Please login again.");
          
          // Navigate to appropriate login page
          if (isBackofficeUser) {
            navigate('/backoffice/login', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
          
          // Clear the interval since we're logging out
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          console.log('🔄 useSessionRefresh: Session is valid');
        }
      } catch (error) {
        console.error('🔄 useSessionRefresh: Error during session validation', error);
        dispatch(setAuthError('Session validation failed'));
      }
    };
    
    // Set up interval for periodic session checks
    intervalRef.current = setInterval(checkSession, intervalMinutes * 60 * 1000);
    
    // Also check immediately
    checkSession();
    
    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentUser, isBackofficeUser, intervalMinutes, dispatch, navigate, location.pathname]);
  
  // Manual session refresh function
  const refreshSession = async (): Promise<boolean> => {
    console.log('🔄 useSessionRefresh: Manual session refresh requested');
    
    try {
      const isValid = await validateSession();
      
      if (!isValid) {
        console.log('🔄 useSessionRefresh: Manual refresh - session invalid');
        
        // Clear state
        dispatch(clearAuth());
        dispatch(resetEmployee());
        clearPersistedAuthState();
        
        // Show error message
        toast.error("Your session has expired. Please login again.");
        
        // Navigate to appropriate login page
        if (isBackofficeUser) {
          navigate('/backoffice/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
        
        return false;
      }
      
      console.log('🔄 useSessionRefresh: Manual refresh - session valid');
      return true;
    } catch (error) {
      console.error('🔄 useSessionRefresh: Error during manual session refresh', error);
      dispatch(setAuthError('Session refresh failed'));
      return false;
    }
  };
  
  return { refreshSession };
};