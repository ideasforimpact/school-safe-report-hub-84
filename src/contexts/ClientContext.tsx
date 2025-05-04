
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from "@/components/ui/sonner";

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
    google: boolean;
    microsoft: boolean;
    zoho: boolean;
  };
}

interface ClientContextType {
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  isEmailDomainAllowed: (email: string, clientId: string) => boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const savedClients = localStorage.getItem('clients');
    return savedClients ? JSON.parse(savedClients) : [];
  });

  // Save clients to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const addClient = (clientData: Omit<Client, 'id' | 'creationDate'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      creationDate: new Date().toISOString(),
    };

    setClients([...clients, newClient]);
    toast.success("Client added successfully");
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(clients.map(client => {
      if (client.id === id) {
        return { ...client, ...updates };
      }
      return client;
    }));
    toast.success("Client updated successfully");
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(client => client.id !== id));
    toast.success("Client deleted successfully");
  };

  const getClientById = (id: string) => {
    return clients.find(client => client.id === id);
  };

  // Function to validate if an email domain is allowed for a specific client
  const isEmailDomainAllowed = (email: string, clientId: string): boolean => {
    const client = getClientById(clientId);
    if (!client || !client.allowedDomains || client.allowedDomains.length === 0) {
      return false;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return client.allowedDomains.some(allowedDomain => 
      allowedDomain.toLowerCase() === domain
    );
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
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
