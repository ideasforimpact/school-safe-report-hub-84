
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OAuthProviderName } from '@/utils/authProviders';
import { getClientsFromStorage, saveClientsToStorage } from '@/services/client/clientService';

export interface Client {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  creationDate: string;
  active: boolean;
  logo?: string;
  moduleAccess?: {
    incidentReporting: boolean;
    allIncidents: boolean;
    insights: boolean;
    benchmarking: boolean;
  };
  allowedDomains?: string[];
  authProviders?: {
    [key in OAuthProviderName]?: boolean;
  };
}

export interface ClientContextType {
  client: Client | null;
  clients: Client[];
  setClient: (client: Client | null) => void;
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>({
    id: 'default-client-id',
    name: 'Default Client',
    email: 'default@example.com',
    contactPerson: 'Default Contact',
    phone: '555-1234',
    creationDate: new Date().toISOString(),
    active: true
  });
  
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients from local storage on initial render
  useEffect(() => {
    const storedClients = getClientsFromStorage();
    if (storedClients.length > 0) {
      setClients(storedClients);
    } else {
      // Initialize with at least one default client if none exist
      const defaultClient = {
        id: 'default-client-id',
        name: 'Default Client',
        email: 'default@example.com',
        contactPerson: 'Default Contact',
        phone: '555-1234',
        creationDate: new Date().toISOString(),
        active: true,
        moduleAccess: {
          incidentReporting: true,
          allIncidents: true,
          insights: true,
          benchmarking: false
        },
        allowedDomains: ['example.com'],
        authProviders: {
          google: true,
          microsoft: false,
          zoho: false
        }
      };
      setClients([defaultClient]);
      saveClientsToStorage([defaultClient]);
    }
  }, []);

  // Add a new client
  const addClient = (clientData: Omit<Client, 'id' | 'creationDate'>) => {
    const newClient = {
      ...clientData,
      id: Date.now().toString(),
      creationDate: new Date().toISOString(),
    };
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    saveClientsToStorage(updatedClients);
  };

  // Update an existing client
  const updateClient = (id: string, updates: Partial<Client>) => {
    const updatedClients = clients.map(client => {
      if (client.id === id) {
        return { ...client, ...updates };
      }
      return client;
    });
    
    setClients(updatedClients);
    saveClientsToStorage(updatedClients);
  };

  // Delete a client
  const deleteClient = (id: string) => {
    const updatedClients = clients.filter(client => client.id !== id);
    setClients(updatedClients);
    saveClientsToStorage(updatedClients);
  };

  return (
    <ClientContext.Provider value={{ 
      client, 
      setClient, 
      clients, 
      addClient, 
      updateClient, 
      deleteClient 
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
