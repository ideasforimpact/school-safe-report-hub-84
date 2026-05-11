import React from 'react';
import { useRealtimeModuleSync } from '@/hooks/useRealtimeModuleSync';
import { useRealtimeClientIntegrationSync } from '@/hooks/useRealtimeClientIntegrationSync';
import { useRefreshBackofficeModules } from '@/hooks/useRefreshBackofficeModules';
import { useSupabaseAutoRefreshSync } from '@/hooks/useSupabaseAutoRefreshSync';


interface ModuleSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables real-time module synchronization
 * This should be placed high in the component tree to ensure all child components
 * benefit from real-time module updates
 */
const ModuleSyncProvider: React.FC<ModuleSyncProviderProps> = ({ children }) => {
  // Pause Supabase auto-refresh on the inactive client so we never see
  // duplicate /auth/v1/token?grant_type=refresh_token requests when a user
  // has sessions in both buckets (SSO + backoffice). Runs on every route
  // change.
  useSupabaseAutoRefreshSync();
  // Initialize real-time module synchronization (client-level employee/client modules)
  useRealtimeModuleSync();
  // Initialize real-time client integration synchronization
  useRealtimeClientIntegrationSync();
  // Initialize real-time backoffice modules sync (level='backoffice' rows in the
  // modules table). Mounted globally so it covers every backoffice route
  // regardless of whether the route uses BackofficeWrapper.
  useRefreshBackofficeModules();

  return <>{children}</>;
};

export default ModuleSyncProvider;