
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client, mapDbClientToClient, prepareClientForDb } from '@/types/clientTypes';

export type InstitutionType = 'CBSE' | 'IB' | 'IGCSE' | 'ICSE' | 'Matric' | 'Combined Campus' | 'Other';

export interface ClientContextType {
  client: Client | null;
  clients: Client[];
  loading: boolean;
  setClient: (client: Client | null) => void;
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// Re-export Client type for use in other files - using the proper syntax for isolated modules
export type { Client };

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load clients from Supabase on initial render
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');

        if (error) {
          throw error;
        }

        const mappedClients = data.map(mapDbClientToClient);
        setClients(mappedClients);
        
        // Set default client if there is at least one
        if (mappedClients.length > 0 && !client) {
          setClient(mappedClients[0]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Add a new client
  const addClient = async (clientData: Omit<Client, 'id' | 'creationDate'>) => {
    setLoading(true);
    try {
      const dbClient = prepareClientForDb(clientData as Client);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select();

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        const newClient = mapDbClientToClient(data[0]);
        setClients(prev => [...prev, newClient]);
        toast.success('Client added successfully');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  // Update an existing client
  const updateClient = async (id: string, updates: Partial<Client>) => {
    setLoading(true);
    try {
      // First get the existing client to merge with updates
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const updatedClient = { ...existingClient, ...updates };
      const dbUpdates = prepareClientForDb(updatedClient);
      
      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  // Delete a client
  const deleteClient = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setClients(prev => prev.filter(client => client.id !== id));
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientContext.Provider value={{ 
      client, 
      setClient, 
      clients, 
      loading,
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
