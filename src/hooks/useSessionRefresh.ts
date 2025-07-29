import { useEffect, useRef } from 'react';
import { validateSession } from '@/utils/sessionValidation';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { clearAuth, setAuthError } from '@/store/authActions';
import { resetEmployee } from '@/store/employeeActions';
import { clearPersistedAuthState } from '@/store/authPersistence';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

// Hook to handle automatic session validation and refresh with safety measures
export const useSessionRefresh = (intervalMinutes: number = 5) => {
  const { state, dispatch } = useEmployeeStore();
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef<boolean>(false);
  const lastValidationRef = useRef<number>(0);
  const validationCountRef = useRef<number>(0);
  
  useEffect(() => {
    // Don't run session refresh on login pages or during logout
    const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
    const isLogoutInProgress = sessionStorage.getItem('is_logout_initiated') === 'true';
    
    // Block validation during logout, on login routes, or if too many validations
    if (!currentUser || isOnLoginRoute || state.isLoggingOut || isLogoutInProgress || validationCountRef.current > 50) {
      console.log('🔄 useSessionRefresh: Validation blocked', {
        hasUser: !!currentUser,
        isOnLoginRoute,
        isLoggingOut: state.isLoggingOut,
        isLogoutInProgress,
        validationCount: validationCountRef.current
      });
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    const checkSession = async () => {
      // Prevent multiple simultaneous validations and circuit breaker
      if (isValidatingRef.current || state.isLoggingOut || validationCountRef.current > 50) {
        return;
      }
      
      const now = Date.now();
      const timeSinceLastValidation = now - lastValidationRef.current;
      
      // Don't validate too frequently (minimum 30 seconds between validations)
      if (timeSinceLastValidation < 30000) return;
      
      // Check logout flag again before validation
      if (sessionStorage.getItem('is_logout_initiated') === 'true') {
        console.log('🔄 useSessionRefresh: Logout detected, aborting validation');
        return;
      }
      
      isValidatingRef.current = true;
      lastValidationRef.current = now;
      validationCountRef.current += 1;
      
      console.log('🔄 useSessionRefresh: Checking session validity', {
        count: validationCountRef.current,
        timestamp: new Date().toISOString()
      });
      
      try {
        const isValid = await validateSession();
        
        if (!isValid && !state.isLoggingOut) {
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
        } else if (isValid) {
          console.log('🔄 useSessionRefresh: Session is valid');
        }
      } catch (error) {
        console.error('🔄 useSessionRefresh: Error during session validation', error);
        dispatch(setAuthError('Session validation failed'));
      } finally {
        isValidatingRef.current = false;
      }
    };
    
    // Set up interval for periodic session checks
    intervalRef.current = setInterval(checkSession, intervalMinutes * 60 * 1000);
    
    // Initial check with delay to prevent race conditions
    const initialTimeout = setTimeout(checkSession, 1000);
    
    // Cleanup interval on unmount or dependency change
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isValidatingRef.current = false;
    };
  }, [currentUser, isBackofficeUser, intervalMinutes, dispatch, navigate, location.pathname, state.isLoggingOut]);
  
  // Manual session refresh function
  const refreshSession = async (): Promise<boolean> => {
    // Block manual refresh during logout or if too many validations
    if (state.isLoggingOut || isValidatingRef.current || validationCountRef.current > 50) {
      console.log('🔄 useSessionRefresh: Manual refresh blocked', {
        isLoggingOut: state.isLoggingOut,
        isValidating: isValidatingRef.current,
        validationCount: validationCountRef.current
      });
      return false;
    }
    
    // Check logout flag
    if (sessionStorage.getItem('is_logout_initiated') === 'true') {
      console.log('🔄 useSessionRefresh: Manual refresh blocked - logout in progress');
      return false;
    }
    
    isValidatingRef.current = true;
    validationCountRef.current += 1;
    
    console.log('🔄 useSessionRefresh: Manual session refresh requested', {
      count: validationCountRef.current
    });
    
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
    } finally {
      isValidatingRef.current = false;
    }
  };
  
  return { refreshSession };
};