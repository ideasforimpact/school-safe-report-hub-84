import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { setEmployeeData } from '@/store/employeeActions';
import { saveEmployeeDataToStorage } from '@/services/auth/authService';
import { toast } from 'sonner';
import type { EmployeeData, ClientIntegration } from '@/contexts/auth/types';

/**
 * Hook to sync client_integration in real-time when changes occur
 * This ensures that when client_integration is updated in backoffice,
 * the client view immediately reflects the changes with a toast notification
 */
export const useRealtimeClientIntegrationSync = () => {
  const { state, dispatch } = useEmployeeStore();
  const { getClientId } = useEmployeeAccess();
  
  // Toast deduplication: prevent multiple identical toasts within 5 seconds
  const lastToastTimeRef = useRef<number>(0);
  const TOAST_DEBOUNCE_MS = 5000; // 5 seconds

  const refreshClientIntegration = useCallback(async () => {
    const clientId = getClientId();
    const employeeData = state.employeeData;
    
    if (!clientId || !employeeData) {
      return;
    }

    try {
      console.log('[useRealtimeClientIntegrationSync] Refreshing client_integration for client:', clientId);
      
      // Refetch client_integration data using RPC function
      const { data: integrationData, error: integrationError } = await (supabase as any)
        .rpc('get_client_integration_for_auth', { p_client_id: clientId });

      if (integrationError) {
        console.error('[useRealtimeClientIntegrationSync] Error fetching client integration:', integrationError);
        return;
      }

      // Transform the integration data
      const clientIntegration: ClientIntegration[] | null = 
        Array.isArray(integrationData) && integrationData.length > 0
        ? integrationData.map((item: any) => ({
            id: item.id,
            client_id: item.client_id,
            target_client_id: item.target_client_id,
            target_client_name: item.target_client_name,
            is_linked: item.is_linked,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
            updated_by: item.updated_by
          }))
        : null;

      console.log('[useRealtimeClientIntegrationSync] Updated client_integration:', clientIntegration);

      // Update employeeData with new client_integration
      const updatedEmployeeData: EmployeeData = {
        ...employeeData,
        client_integration: clientIntegration,
        // Also update the client object if it exists
        client: employeeData.client ? {
          ...employeeData.client,
          client_integration: clientIntegration
        } : null
      };

      // Update Redux store
      dispatch(setEmployeeData(updatedEmployeeData));
      
      // Update local storage
      saveEmployeeDataToStorage(updatedEmployeeData);
      
      console.log('[useRealtimeClientIntegrationSync] Employee data updated with new client_integration');
      
      // Show toast notification with deduplication - only if enough time has passed
      const currentTime = Date.now();
      if (currentTime - lastToastTimeRef.current > TOAST_DEBOUNCE_MS) {
        lastToastTimeRef.current = currentTime;
        toast.info('Client Integration Updated', {
          description: 'Your client integration settings have been updated. Changes are now active.',
        });
      }
    } catch (error) {
      console.error('[useRealtimeClientIntegrationSync] Error refreshing client integration:', error);
    }
  }, [getClientId, state.employeeData, dispatch]);

  useEffect(() => {
    const clientId = getClientId();
    
    if (!clientId) {
      return;
    }

    console.log('[useRealtimeClientIntegrationSync] Setting up realtime subscription for client_integration, clientId:', clientId);

    // Subscribe to changes in the client_integration table for this client
    const clientIntegrationChannel = supabase
      .channel('client-integration-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'client_integration',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('[useRealtimeClientIntegrationSync] Client integration change detected:', payload);
          // Refresh client_integration when changes are detected
          refreshClientIntegration();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeClientIntegrationSync] Successfully subscribed to client_integration changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeClientIntegrationSync] Error subscribing to client_integration changes');
        }
      });

    return () => {
      console.log('[useRealtimeClientIntegrationSync] Cleaning up client_integration realtime subscription');
      supabase.removeChannel(clientIntegrationChannel);
    };
  }, [getClientId, refreshClientIntegration]);

  return {
    refreshClientIntegration
  };
};


