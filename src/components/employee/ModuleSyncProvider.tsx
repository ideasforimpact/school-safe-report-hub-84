import React from 'react';
import { useRealtimeModuleSync } from '@/hooks/useRealtimeModuleSync';

interface ModuleSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables real-time module synchronization
 * This should be placed high in the component tree to ensure all child components
 * benefit from real-time module updates
 */
const ModuleSyncProvider: React.FC<ModuleSyncProviderProps> = ({ children }) => {
  // Initialize real-time module synchronization
  useRealtimeModuleSync();
  
  // Initialize real-time client integration synchronization
  useRealtimeClientIntegrationSync();
  
  return <>{children}</>;
};

export default ModuleSyncProvider;