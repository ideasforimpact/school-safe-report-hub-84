
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Client {
  id: string;
  name: string;
  domain: string;
}

interface ClientContextType {
  clients: Client[];
  currentClient: Client | null;
  setCurrentClient: (client: Client | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  const value = {
    clients,
    currentClient,
    setCurrentClient,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};
