
import { useContext } from 'react';
import { ClientContext, ClientContextType } from '@/contexts/ClientContext';

// Safe client hook that returns defaults when context is not available
export const useSafeClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  
  // If context is not available (not in backoffice), return safe defaults
  if (context === undefined) {
    return {
      client: null,
      clients: [],
      loading: false,
      setClient: () => {},
      addClient: async () => null,
      updateClient: async () => {},
      deleteClient: async () => {},
      fetchClients: async () => {},
      isEmailDomainAllowed: () => false
    };
  }
  
  return context;
};
