import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Options for configuring the real-time subscription
 */
export interface UseRealTimeSubHookOptions {
  /** Name of the channel for this subscription */
  channelName: string;
  /** Event type(s) to listen for: 'INSERT', 'UPDATE', 'DELETE', or '*' for all events */
  events: 'INSERT' | 'UPDATE' | 'DELETE' | '*' | ('INSERT' | 'UPDATE' | 'DELETE')[];
  /** Table name to subscribe to */
  table: string;
  /** Optional filter string (e.g., 'employee_id=eq.123') */
  filter?: string;
  /** Schema name (defaults to 'public') */
  schema?: string;
  /** Callback function that receives the payload when changes occur */
  onPayload?: (payload: RealtimePostgresChangesPayload<any>) => void;
  /** Optional callback for subscription status changes */
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
  /** Enable/disable the subscription (defaults to true) */
  enabled?: boolean;
}

/**
 * Custom hook for creating dynamic Supabase real-time subscriptions
 * 
 * @example
 * ```tsx
 * useRealTimeSubHook({
 *   channelName: 'employee-documents-changes',
 *   events: 'UPDATE',
 *   table: 'employee_documents',
 *   filter: 'employee_id=eq.123',
 *   onPayload: (payload) => {
 *     console.log('Update received:', payload);
 *     // Handle the update
 *   }
 * });
 * ```
 * 
 * @example
 * ```tsx
 * // Multiple events
 * useRealTimeSubHook({
 *   channelName: 'incident-changes',
 *   events: ['INSERT', 'UPDATE', 'DELETE'],
 *   table: 'incidents',
 *   onPayload: (payload) => {
 *     // Handle all changes
 *   }
 * });
 * ```
 */
export const useRealTimeSubHook = (options: UseRealTimeSubHookOptions) => {
  const {
    channelName,
    events,
    table,
    filter,
    schema = 'public',
    onPayload,
    onStatusChange,
    enabled = true,
  } = options;

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Validate required options
    if (!channelName || !table || !events) {
      console.warn('useRealTimeSubHook: Missing required options (channelName, table, events)');
      return;
    }

    // Create channel
    const channel = supabase.channel(channelName);

    // Build subscription config
    const subscriptionConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    } = {
      event: Array.isArray(events) ? '*' : (events as 'INSERT' | 'UPDATE' | 'DELETE' | '*'),
      schema,
      table,
    };

    // Add filter if provided
    if (filter) {
      subscriptionConfig.filter = filter;
    }

    // If events is an array, we need to subscribe to each event separately
    // Otherwise, use '*' or the single event directly
    if (Array.isArray(events)) {
      events.forEach((event) => {
        channel.on('postgres_changes', {
          ...subscriptionConfig,
          event: event as 'INSERT' | 'UPDATE' | 'DELETE',
        }, (payload) => {
          if (onPayload) {
            onPayload(payload);
          }
        });
      });
    } else {
      // Single event or '*' - no loop needed
      channel.on('postgres_changes', subscriptionConfig, (payload) => {
        if (onPayload) {
          onPayload(payload);
        }
      });
    }

    // Subscribe to the channel
    // This callback is called when the subscription status changes:
    // - 'SUBSCRIBED': When successfully connected to the channel
    // - 'TIMED_OUT': When connection attempt times out
    // - 'CLOSED': When the channel is closed
    // - 'CHANNEL_ERROR': When there's an error with the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[useRealTimeSubHook] Subscribed to channel: ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[useRealTimeSubHook] Error subscribing to channel: ${channelName}`);
      }
      
      // Call the optional status change callback if provided
      // This allows components to react to subscription status changes
      // (e.g., show loading state, handle errors, etc.)
      if (onStatusChange) {
        onStatusChange(status as any);
      }
    });

    // Store channel reference for cleanup
    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`[useRealTimeSubHook] Unsubscribing from channel: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    channelName,
    events,
    table,
    filter,
    schema,
    onPayload,
    onStatusChange,
    enabled,
  ]);

  // Return channel reference for manual control if needed
  return {
    channel: channelRef.current,
  };
};

