
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ClientProvider } from '@/contexts/ClientContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser } from '@/store/authSelectors';

interface BackofficeClientProviderProps {
  children: React.ReactNode;
}

export const BackofficeClientProvider: React.FC<BackofficeClientProviderProps> = ({ children }) => {
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get authentication state from Redux
  const currentUser = getCurrentUser(state);
  const isAuthenticated = getIsAuthenticated(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  
  // Check if we should provide client context
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  const shouldProvideClientContext = isBackofficeRoute && isAuthenticated && (isBackofficeUser || currentUser?.role === 'saas_owner');
  
  // Only provide ClientProvider for authenticated backoffice users on backoffice routes
  if (shouldProvideClientContext) {
    return (
      <ClientProvider>
        {children}
      </ClientProvider>
    );
  }
  
  // For non-backoffice routes or unauthenticated users, just render children without client context
  return <>{children}</>;
};
