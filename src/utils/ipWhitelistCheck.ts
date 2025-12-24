/**
 * IP Whitelist Check Utility
 * Validates if the current user's IP is whitelisted for their client
 * Uses validate-employee edge function which includes IP validation
 */

import { supabase } from '@/integrations/supabase/client';

// Request deduplication: track ongoing requests to prevent duplicate calls
const ongoingRequests = new Map<string, Promise<IPWhitelistCheckResult>>();

export interface IPWhitelistCheckResult {
  allowed: boolean;
  reason?: string;
  error?: string;
}

/**
 * Check if the current user's IP is whitelisted for their client
 * Calls the validate-employee edge function which includes IP validation
 * Uses supabase.functions.invoke to automatically include Authorization header
 * Uses request deduplication to prevent multiple simultaneous calls
 * 
 * @param clientId - The client ID to check
 * @param employeeId - The employee ID to check (required)
 * @returns Promise<IPWhitelistCheckResult>
 */
export async function checkIPWhitelist(clientId: string | null, employeeId: string | null): Promise<IPWhitelistCheckResult> {
  // Skip check if no client ID (e.g., backoffice users)
  if (!clientId) {
    return { allowed: true, reason: 'no_client_id' };
  }

  if (!employeeId) {
    // No employee ID, can't validate - allow (will be caught by auth check)
    return { allowed: true, reason: 'no_employee_id' };
  }

  // Create a unique key for request deduplication
  const requestKey = `${clientId}-${employeeId}`;
  
  // If there's already an ongoing request for this client+employee, return it
  if (ongoingRequests.has(requestKey)) {
    return ongoingRequests.get(requestKey)!;
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Call the validate-employee edge function using supabase.functions.invoke
      // This automatically includes the Authorization header from the current session
      const { data, error } = await supabase.functions.invoke('validate-employee', {
        body: {
          employeeId: employeeId,
          clientId: clientId
        }
      });

      // Handle IP whitelist error (403 status)
      if (error) {
        // Check if it's an IP whitelist error
        if (error.status === 403 || error.message?.includes('IP_NOT_WHITELISTED') || error.message?.includes('not whitelisted')) {
          const errorMessage = error.message || 
                              'Your IP address is not whitelisted for this client. Please contact your administrator to add your IP address to the whitelist.';
          
          return {
            allowed: false,
            reason: 'ip_not_whitelisted',
            error: errorMessage
          };
        }

        // For 401 errors, check if it's due to missing auth (shouldn't happen with supabase.functions.invoke)
        if (error.status === 401) {
          console.warn('Employee validation returned 401, allowing access (backend will validate):', error.message);
          return { 
            allowed: true, 
            reason: 'auth_error', 
            error: error.message 
          };
        }

        // Other errors - log but allow (backend will validate on API calls)
        console.warn('Employee validation returned error, allowing access (backend will validate):', {
          status: error.status,
          message: error.message
        });
        
        return { 
          allowed: true, 
          reason: 'validation_error', 
          error: error.message 
        };
      }

      // Success response - if valid is true, IP is whitelisted
      if (data && data.valid === true) {
        return { allowed: true };
      }

      // If validation failed but no error (shouldn't happen)
      if (data && data.valid === false) {
        const errorMessage = data.message || 'Employee validation failed';
        
        // Check if it's IP whitelist related
        if (data.code === 'IP_NOT_WHITELISTED') {
          return {
            allowed: false,
            reason: 'ip_not_whitelisted',
            error: errorMessage
          };
        }
        
        return { 
          allowed: true, 
          reason: 'validation_failed', 
          error: errorMessage 
        };
      }

      // Default to allowed if check fails (backend will validate on API calls)
      return { allowed: true, reason: 'check_incomplete' };
    } catch (error) {
      console.error('Error checking IP whitelist:', error);
      // On error, allow access (backend will validate on API calls)
      return { 
        allowed: true, 
        reason: 'check_failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // Remove from ongoing requests after completion
      ongoingRequests.delete(requestKey);
    }
  })();

  // Store the promise for deduplication
  ongoingRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

