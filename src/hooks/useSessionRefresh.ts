import { useEffect, useRef } from 'react';
import { validateSession } from '@/utils/sessionValidation';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { clearAuth, setAuthError } from '@/store/authActions';
import { resetEmployee } from '@/store/employeeActions';
import { clearPersistedAuthState } from '@/store/authPersistence';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { authCoordinator } from '@/utils/authCoordinator';

// Hook to handle automatic session validation and refresh
export const useSessionRefresh = (intervalMinutes: number = 5) => {
  const { state, dispatch } = useEmployeeStore();
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const validationCountRef = useRef(0);
  const MAX_VALIDATIONS = 5;
  
  useEffect(() => {
    // Early return for SSO users - they don't need session validation
    if (currentUser && !isBackofficeUser) {
      return;
    }

    // Skip session refresh during logout, login, or on login routes
    const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
    const isLogoutInProgress = authCoordinator.isLogoutInProgress();
    const isLoginInProgress = sessionStorage.getItem('is_login_in_progress') === 'true' ||
                             localStorage.getItem('is_login_in_progress') === 'true';
    
    if (!currentUser || isOnLoginRoute || isLogoutInProgress || isLoginInProgress) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    const checkSession = async () => {
      // Circuit breaker: prevent too many validations
      if (validationCountRef.current >= MAX_VALIDATIONS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // Check for login in progress
      const isLoginInProgress = sessionStorage.getItem('is_login_in_progress') === 'true' ||
                               localStorage.getItem('is_login_in_progress') === 'true';

      // Don't run if login is in progress
      if (isLoginInProgress) {
        return;
      }

      validationCountRef.current++;
      
      try {
        const isValid = await validateSession();
        
        if (!isValid) {
          // Clear state
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          
          // Show error message and navigate
          toast.error("Your session has expired. Please login again.");
          
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
          // Reset validation counter on successful validation
          validationCountRef.current = 0;
        }
      } catch (error) {
        console.error('Session validation error:', error);
        dispatch(setAuthError('Session validation failed'));
      }
    };
    
    // Set up interval for periodic session checks
    intervalRef.current = setInterval(checkSession, intervalMinutes * 60 * 1000);
    
    // Check immediately after a short delay
    setTimeout(checkSession, 1000);
    
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
    // For SSO users, always return true (no validation needed)
    if (currentUser && !isBackofficeUser) {
      return true;
    }
    
    try {
      const isValid = await validateSession();
      
      if (!isValid) {
        // Clear state
        dispatch(clearAuth());
        dispatch(resetEmployee());
        clearPersistedAuthState();
        
        // Show error message and navigate
        toast.error("Your session has expired. Please login again.");
        
        if (isBackofficeUser) {
          navigate('/backoffice/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      dispatch(setAuthError('Session refresh failed'));
      return false;
    }
  };
  
  return { refreshSession };
};