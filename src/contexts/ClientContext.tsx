
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  // Add other client properties as needed
}

export interface ClientContextType {
  client: Client | null;
  setClient: (client: Client | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>({
    id: 'default-client-id',
    name: 'Default Client'
  });

  return (
    <ClientContext.Provider value={{ client, setClient }}>
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
