
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ensureFreshAuthenticatedSession } from '@/utils/sessionValidation';

/** Coalesce duplicate validation runs (e.g. React 18 Strict Mode double effect + fast remount). */
const validationInflight = new Map<string, Promise<void>>();
let lastValidationSuccessKey: string | null = null;
let lastValidationSuccessAt = 0;
const VALIDATION_SUCCESS_DEDUPE_MS = 750;

function runEmployeeValidationDeduped(key: string, fn: () => Promise<void>): Promise<void> {
  const inflight = validationInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const now = Date.now();
  if (lastValidationSuccessKey === key && now - lastValidationSuccessAt < VALIDATION_SUCCESS_DEDUPE_MS) {
    return Promise.resolve();
  }

  const p = fn().finally(() => {
    validationInflight.delete(key);
  });

  validationInflight.set(key, p);
  return p;
}

/**
 * Custom hook to validate employee access on page loads and visibility changes.
 * Will redirect to login page if validation fails.
 */
export const useEmployeeValidation = () => {
  const { employeeData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  const lastValidationRef = useRef<number>(0);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef<boolean>(false);

  // Collapse the four individual auth-field deps into two stable derived values.
  // This prevents the effect from firing separately for each field when auth and
  // the employee store hydrate at different times.
  const employeeId = employeeData?.id || state.employeeData?.id || null;
  const validationClientId = employeeData?.homeClientId || employeeData?.clientId || null;

  // Function to check if the current path is a backoffice path
  const isBackofficePath = () => {
    return location.pathname.startsWith('/backoffice');
  };

  // Keep /users route quiet: user requested only user-page data call on hard refresh.
  const isQuietUsersRoute = () => {
    return location.pathname === '/users';
  };

  // Function to validate the employee (non-backoffice paths only)
  const validateEmployee = async () => {
    if (state.isLoggingOut) return;
    if (isBackofficePath()) return;

    // Skip validation for users route to avoid extra network requests on hard refresh.
    if (isQuietUsersRoute()) {
      return;
    }
    
    const employeeId = employeeData?.id || state.employeeData?.id || null;
    const validationClientId = employeeData?.homeClientId || employeeData?.clientId || null;

    if (!employeeId || !validationClientId) return;

    const dedupeKey = `${employeeData.id}:${employeeData.clientId}:${location.pathname}`;

    await runEmployeeValidationDeduped(dedupeKey, async () => {
      if (isValidatingRef.current) {
        return;
      }

      isValidatingRef.current = true;

      try {
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('Supabase URL not found');
        return;
      }
      
      const fresh = await ensureFreshAuthenticatedSession();
      if (!fresh.ok) {
        const msg =
          fresh.reason === 'refresh_failed'
            ? 'Your session has expired. Please log in again.'
            : 'Your session is not authenticated. Please login again.';
        console.warn('[validate-employee] Session not valid:', fresh.reason);
        logout('session_expired', msg);
        return;
      }

      console.log('[validate-employee] Session refreshed/authenticated — calling validate-employee API');

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      const response = await fetch(`${supabaseUrl}/functions/v1/validate-employee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fresh.accessToken}`,
          apikey: anonKey ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          clientId: validationClientId
        }),
      });
      
      // Parse response body (works for both 200 and 403)
      let responseBody: any = null;
      try {
        const text = await response.text();
        if (text) {
          responseBody = JSON.parse(text);
        }
      } catch (e) {
        console.warn('Failed to parse response body:', e);
      }

      if (!response.ok || !responseBody?.valid) {
        if (state.isLoggingOut) {
          return;
        }

        let isIPWhitelistError = false;
        let errorMessage: string | undefined = undefined;
        let logoutReason: 'ip_not_whitelisted' | 'session_expired' | 'validation_failed' = 'validation_failed';
        
        // Check if it's an IP whitelist error from response body
        if (responseBody) {
          isIPWhitelistError = responseBody.code === 'IP_NOT_WHITELISTED' ||
                              (responseBody.message && (
                                responseBody.message.includes('not whitelisted') ||
                                responseBody.message.includes('IP_NOT_WHITELISTED')
                              ));
        }
        
        // Also check response status - if 403, assume IP whitelist error
        if (!isIPWhitelistError && response.status === 403) {
          isIPWhitelistError = true;
        }
        
        if (isIPWhitelistError) {
          logoutReason = 'ip_not_whitelisted';
          // Extract message from response body (this is the actual backend message)
          if (responseBody?.message) {
            errorMessage = responseBody.message;
          } else {
            // Use default formatted message if responseBody.message is not available
            errorMessage = 'Your IP address is not whitelisted for this client. Please contact your administrator to add your IP address to the whitelist.';
          }
        } else {
          logoutReason = 'session_expired';
          // For non-IP errors, use responseBody.message or default
          if (responseBody?.message) {
            errorMessage = responseBody.message;
          } else {
            errorMessage = 'Your session has expired. Please log in again.';
          }
        }
        
        // Call logout with reason and message (toast will be shown in logout function)
        logout(logoutReason, errorMessage);
        // Stop here if validation failed – no RLS debug in invalid state
        return;
      }

      console.log('[validate-employee] OK: Employee validation succeeded');

      lastValidationSuccessKey = dedupeKey;
      lastValidationSuccessAt = Date.now();

      // Update last validation timestamp
      lastValidationRef.current = Date.now();
      
    } catch (error) {
      console.error('Error during employee validation:', error);
    } finally {
      isValidatingRef.current = false;
    }
    });
  };

  // Clean up function
  const cleanup = () => {
    if (validationTimeoutRef.current) {
      clearInterval(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
  };

  // Effect to set up validation on page loads and visibility changes (non-backoffice)
  useEffect(() => {
    // Skip for backoffice paths or if logging out
    if (isBackofficePath() || isQuietUsersRoute() || state.isLoggingOut) {
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
    if (!state.isLoggingOut) {
      validateEmployee();
    }
    
    // Set up periodic validation (every 30 minutes)
    if (!state.isLoggingOut) {
      validationTimeoutRef.current = setInterval(() => {
        if (!state.isLoggingOut) {
          validateEmployee();
        }
      }, 30 * 60 * 1000);
    }
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    employeeData?.id,
    employeeData?.homeClientId,
    employeeData?.clientId,
    state.employeeData?.id,
    location.pathname,
    state.isLoggingOut,
  ]);


  // Clean up when logging out
  useEffect(() => {
    if (state.isLoggingOut) {
      cleanup();
    }
  }, [state.isLoggingOut]);

  return { validateEmployee };
};
