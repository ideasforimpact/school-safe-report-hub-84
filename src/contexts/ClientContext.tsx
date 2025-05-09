
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import {
  addClient as addClientService,
  updateClient as updateClientService,
  deleteClient as deleteClientService,
  getClientById as getClientByIdService,
  isEmailDomainAllowed as isEmailDomainAllowedService,
  getClientsFromStorage,
  saveClientsToStorage
} from '@/services/client/clientService';
import { OAuthProviderName } from '@/utils/authProviders';

export interface Client {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  creationDate: string;
  moduleAccess: {
    incidentReporting: boolean;
    allIncidents: boolean;
    insights: boolean;
    benchmarking: boolean;
  };
  active: boolean;
  logo?: string; // Optional logo URL
  allowedDomains: string[]; // Array of allowed email domains
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
}

interface ClientContextType {
  clients: Client[];
  currentClient?: Client; // Add currentClient property
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  isEmailDomainAllowed: (email: string, clientId: string) => boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(() => getClientsFromStorage());
  const [currentClient, setCurrentClient] = useState<Client | undefined>(
    clients.length > 0 ? clients[0] : undefined
  );

  // Save clients to localStorage whenever they change
  useEffect(() => {
    saveClientsToStorage(clients);
  }, [clients]);

  const addClient = (clientData: Omit<Client, 'id' | 'creationDate'>) => {
    setClients(addClientService(clients, clientData));
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(updateClientService(clients, id, updates));
  };

  const deleteClient = (id: string) => {
    setClients(deleteClientService(clients, id));
  };

  const getClientById = (id: string) => {
    return getClientByIdService(clients, id);
  };

  // Function to validate if an email domain is allowed for a specific client
  const isEmailDomainAllowed = (email: string, clientId: string): boolean => {
    const client = getClientById(clientId);
    return isEmailDomainAllowedService(email, client);
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
      currentClient,  // Add currentClient to the context value
      addClient, 
      updateClient, 
      deleteClient,
      getClientById,
      isEmailDomainAllowed
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
