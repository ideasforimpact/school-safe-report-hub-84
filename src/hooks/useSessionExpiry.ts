import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { loadAuthState } from '@/store/authPersistence';
import { 
  getSessionExpiry, 
  getTimeRemaining, 
  isWithinWarningWindow,
  clearSessionExpiry 
} from '@/services/auth/sessionExpiryService';
import { refreshSupabaseSession } from '@/services/auth/tokenRefreshService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Format date to IST (Indian Standard Time)
 */
const formatToIST = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Hook to monitor session expiry and manage popup state for SSO users
 * 
 * Features:
 * - Monitors session expiry every 30 seconds
 * - Shows popup when within 3 minutes of expiry
 * - Handles refresh and logout actions
 * - Auto-redirects to login if session expires
 * - Prevents infinite loops with proper refs and dependencies
 */
export const useSessionExpiry = () => {
  const { user, logout } = useAuth();
  const { state } = useEmployeeStore();
  const navigate = useNavigate();
  
  // State
  const [showPopup, setShowPopup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs to prevent infinite loops and concurrent operations
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fastCheckRef = useRef<NodeJS.Timeout | null>(null);
  const checkInProgressRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  
  // Check if user is SSO user - use state to track and update
  const [isSSOUser, setIsSSOUser] = useState(false);
  
  // Effect to check SSO status - runs when user or auth state changes
  useEffect(() => {
    const checkSSOStatus = async () => {
      if (!user) {
        setIsSSOUser(false);
        return;
      }
      
      // Check auth state first
      const authState = loadAuthState();
      console.log('🔍 useSessionExpiry: Checking SSO status', {
        hasUser: !!user,
        hasAuthState: !!authState,
        sessionType: authState?.sessionType,
        isBackofficeUser: authState?.isBackofficeUser
      });
      
      if (authState?.sessionType === 'sso') {
        console.log('✅ useSessionExpiry: SSO user detected from auth state');
        setIsSSOUser(true);
        return;
      }
      
      // Fallback: Check Supabase session directly
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && (session.provider_token || session.provider_refresh_token)) {
          // Has Supabase session with provider token (OAuth)
          console.log('✅ useSessionExpiry: SSO user detected from Supabase session');
          setIsSSOUser(true);
          return;
        }
      } catch (error) {
        console.error('❌ Error checking Supabase session:', error);
      }
      
      console.log('⏸️ useSessionExpiry: Not SSO user');
      setIsSSOUser(false);
    };
    
    checkSSOStatus();
    
    // Also set up a small interval to re-check (in case auth state is saved after initial check)
    const intervalId = setInterval(() => {
      if (user) {
        const authState = loadAuthState();
        if (authState?.sessionType === 'sso') {
          // Use functional update to get current state
          setIsSSOUser(prev => {
            if (!prev) {
              console.log('✅ useSessionExpiry: SSO user detected on re-check');
              return true;
            }
            return prev;
          });
        }
      }
    }, 1000); // Check every second for first 5 seconds
    
    // Clear interval after 5 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [user, state.configuredModules, state.employeeData]); // Re-check when user or auth state changes
  
  // Main monitoring effect
  useEffect(() => {
    console.log('🔍 useSessionExpiry: Effect running', { isSSOUser, hasUser: !!user });
    
    // Only for SSO users
    if (!isSSOUser || !user) {
      console.log('⏸️ useSessionExpiry: Not SSO user or no user, skipping');
      // Cleanup if not SSO user
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowPopup(false);
      return;
    }
    
    console.log('✅ useSessionExpiry: SSO user detected, starting monitoring');
    
    const checkExpiry = () => {
      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        return;
      }
      
      checkInProgressRef.current = true;
      
      try {
        const expiryAt = getSessionExpiry();
        
        if (!expiryAt) {
          // No expiry set or already expired
          console.log('⏰ useSessionExpiry: No expiry found in sessionStorage');
          checkInProgressRef.current = false;
          return;
        }
        
        const remaining = getTimeRemaining();
        setTimeRemaining(remaining);
        
        const remainingMinutes = Math.floor(remaining / 60000);
        const remainingSeconds = Math.floor((remaining % 60000) / 1000);
        console.log('⏰ useSessionExpiry: Time remaining:', {
          remainingMs: remaining,
          remainingMinutes,
          remainingSeconds,
          timeString: `${remainingMinutes}m ${remainingSeconds}s`,
          withinWarningWindow: isWithinWarningWindow(),
          timestamp: formatToIST(new Date())
        });
        
        // Show popup if within 3 minutes
        if (isWithinWarningWindow()) {
          console.log('🔔 useSessionExpiry: Showing popup (within 3 minutes)');
          setShowPopup(true);
        } else {
          setShowPopup(false);
        }
        
        // Auto-redirect if expired and not already redirected
        if (remaining <= 0 && !hasRedirectedRef.current) {
          console.log('⏰ useSessionExpiry: Session expired (0 seconds), auto-logging out');
          hasRedirectedRef.current = true;
          setShowPopup(false); // Close popup before redirect
          clearSessionExpiry();
          toast.error('Your session has expired. Please login again.');
          logout();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('❌ Error checking session expiry:', error);
      } finally {
        checkInProgressRef.current = false;
      }
    };
    
    // Check immediately
    checkExpiry();
    
    // Check every 30 seconds for normal monitoring
    intervalRef.current = setInterval(checkExpiry, 30000);
    
    // Fast check every second when popup is shown (for accurate countdown and immediate auto-logout at 0)
    // Clear any existing fast check first
    if (fastCheckRef.current) {
      clearInterval(fastCheckRef.current);
      fastCheckRef.current = null;
    }
    
    if (showPopup) {
      fastCheckRef.current = setInterval(() => {
        const expiryAt = getSessionExpiry();
        if (expiryAt) {
          const remaining = getTimeRemaining();
          setTimeRemaining(remaining);
          
          // Auto-logout immediately when expired (0 seconds)
          if (remaining <= 0 && !hasRedirectedRef.current) {
            console.log('⏰ useSessionExpiry: Session expired (0 seconds), auto-logging out');
            hasRedirectedRef.current = true;
            setShowPopup(false); // Close popup before redirect
            clearSessionExpiry();
            toast.error('Your session has expired. Please login again.');
            logout();
            navigate('/login', { replace: true });
          }
        }
      }, 1000); // Check every second when popup is visible
    }
    
    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (fastCheckRef.current) {
        clearInterval(fastCheckRef.current);
        fastCheckRef.current = null;
      }
      checkInProgressRef.current = false;
    };
  }, [isSSOUser, user, logout, navigate, showPopup]); // Add showPopup to dependencies
  
  // Refresh handler - uses useCallback for stability
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      const result = await refreshSupabaseSession();
      
      if (result.success) {
        setShowPopup(false);
        toast.success('Session refreshed successfully');
        // Reset redirect flag since we have a new session
        hasRedirectedRef.current = false;
      } else {
        toast.error(result.error || 'Failed to refresh session. Please login again.');
        clearSessionExpiry();
        logout();
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      toast.error('Error refreshing session. Please login again.');
      clearSessionExpiry();
      logout();
      navigate('/login', { replace: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, logout, navigate]);
  
  // Logout handler - uses useCallback for stability
  const handleLogout = useCallback(() => {
    clearSessionExpiry();
    hasRedirectedRef.current = false;
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);
  
  // Close handler - temporarily dismisses popup
  const handleClose = useCallback(() => {
    // Only allow closing if not in critical window (last 30 seconds)
    const criticalWindow = 30 * 1000; // 30 seconds
    if (timeRemaining > criticalWindow) {
      setShowPopup(false);
    }
  }, [timeRemaining]);
  
  return {
    showPopup,
    timeRemaining,
    isRefreshing,
    onReLogin: handleRefresh,
    onGoToLogin: handleLogout,
    onClose: handleClose
  };
};

