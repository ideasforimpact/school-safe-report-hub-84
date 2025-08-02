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
  
  // Early return for SSO users - they don't need session validation
  // Supabase handles all token management for SSO users automatically
  if (currentUser && !isBackofficeUser) {
    console.log('🔄 useSessionRefresh: Skipping for SSO user - Supabase handles session management');
    return { refreshSession: async () => true }; // Return dummy function that always returns true
  }
  
  useEffect(() => {
    // Enhanced conditions to prevent session refresh during logout or login
    const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
    const isLogoutInProgress = authCoordinator.isLogoutInProgress();
    const isLoginInProgress = sessionStorage.getItem('is_login_in_progress') === 'true' ||
                             localStorage.getItem('is_login_in_progress') === 'true';
    
    if (!currentUser || isOnLoginRoute || isLogoutInProgress || isLoginInProgress || authCoordinator.shouldBlockOperation('session refresh')) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (isLogoutInProgress) {
        console.log('🔄 useSessionRefresh: Skipping session refresh - logout in progress');
      } else if (isLoginInProgress) {
        console.log('🔄 useSessionRefresh: Skipping session refresh - login in progress');
      }
      return;
    }
    
    const checkSession = async () => {
      // Circuit breaker: prevent too many validations
      if (validationCountRef.current >= MAX_VALIDATIONS) {
        console.log('🔄 useSessionRefresh: Max validations reached, stopping');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // Check for login in progress
      const isLoginInProgress = sessionStorage.getItem('is_login_in_progress') === 'true' ||
                               localStorage.getItem('is_login_in_progress') === 'true';

      // Don't run if coordinator blocks it or login is in progress
      if (authCoordinator.shouldBlockOperation('session refresh validation') || isLoginInProgress) {
        console.log('🔄 useSessionRefresh: Validation blocked by coordinator or login in progress');
        return;
      }

      validationCountRef.current++;
      console.log(`🔄 useSessionRefresh: Checking session validity (attempt ${validationCountRef.current}/${MAX_VALIDATIONS})`);
      
      try {
        const isValid = await validateSession();
        
        if (!isValid) {
          console.log('🔄 useSessionRefresh: Session invalid, logging out');
          
          // Clear state
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          
          // Show error message only if we can navigate
          if (authCoordinator.canNavigate(isBackofficeUser ? '/backoffice/login' : '/login')) {
            toast.error("Your session has expired. Please login again.");
            
            // Navigate to appropriate login page
            if (isBackofficeUser) {
              navigate('/backoffice/login', { replace: true });
            } else {
              navigate('/login', { replace: true });
            }
          }
          
          // Clear the interval since we're logging out
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          console.log('🔄 useSessionRefresh: Session is valid');
          // Reset validation counter on successful validation
          validationCountRef.current = 0;
        }
      } catch (error) {
        console.error('🔄 useSessionRefresh: Error during session validation', error);
        dispatch(setAuthError('Session validation failed'));
      }
    };
    
    // Adjust interval based on user type (SSO users need less frequent checks)
    const actualIntervalMinutes = isBackofficeUser ? intervalMinutes : intervalMinutes * 2;
    
    // Set up interval for periodic session checks
    intervalRef.current = setInterval(checkSession, actualIntervalMinutes * 60 * 1000);
    
    // Also check immediately (but not if we're just starting up)
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
    console.log('🔄 useSessionRefresh: Manual session refresh requested');
    
    // Don't allow manual refresh if operations are blocked
    if (authCoordinator.shouldBlockOperation('manual session refresh')) {
      console.log('🔄 useSessionRefresh: Manual refresh blocked by coordinator');
      return true; // Return true to avoid triggering logout
    }
    
    try {
      const isValid = await validateSession();
      
      if (!isValid) {
        console.log('🔄 useSessionRefresh: Manual refresh - session invalid');
        
        // Clear state
        dispatch(clearAuth());
        dispatch(resetEmployee());
        clearPersistedAuthState();
        
        // Show error message and navigate only if allowed
        if (authCoordinator.canNavigate(isBackofficeUser ? '/backoffice/login' : '/login')) {
          toast.error("Your session has expired. Please login again.");
          
          // Navigate to appropriate login page
          if (isBackofficeUser) {
            navigate('/backoffice/login', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
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