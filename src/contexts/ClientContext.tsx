
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDbClientToClient, prepareClientForDb } from '@/types/clientTypes';

export type InstitutionType = 'CBSE' | 'IB' | 'IGCSE' | 'ICSE' | 'Matric' | 'Combined Campus' | 'Other';

export interface Client {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  creationDate: string;
  active: boolean;
  logo?: string;
  institutionType?: string;
  moduleAccess?: Partial<ModulePermissions>;
  allowedDomains?: string[];
  authProviders?: {
    [key in OAuthProviderName]?: boolean;
  };
}

export interface ClientContextType {
  client: Client | null;
  clients: Client[];
  loading: boolean;
  setClient: (client: Client | null) => void;
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// Re-export Client type for use in other files
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
        // Get all clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) {
          throw clientsError;
        }

        // Fetch module access for all clients
        const { data: modulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select('*');

        if (modulesError) {
          throw modulesError;
        }

        // Group module access by client id
        const modulesByClient: Record<string, any[]> = {};
        modulesData?.forEach(module => {
          if (!modulesByClient[module.client_id]) {
            modulesByClient[module.client_id] = [];
          }
          modulesByClient[module.client_id].push(module);
        });

        // Map clients and include their module access
        const mappedClients = clientsData.map(dbClient => {
          const clientModules = modulesByClient[dbClient.id] || [];
          const moduleAccess = mapModulesToPermissions(clientModules);
          
          return {
            ...mapDbClientToClient(dbClient),
            moduleAccess
          };
        });

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

  const mapModulesToPermissions = (clientModules: any[]): Partial<ModulePermissions> => {
    const permissions: Partial<ModulePermissions> = {
      superAdmin: false,
      incidentReporting: false,
      incidentAdmin: false,
      assessmentUser: false,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: false
    };

    clientModules.forEach(module => {
      if (module.enabled) {
        // Map module_key to the appropriate permission
        switch (module.module_key) {
          case 'superAdmin':
            permissions.superAdmin = true;
            break;
          case 'incidentReporting':
            permissions.incidentReporting = true;
            break;
          case 'incidentAdmin':
            permissions.incidentAdmin = true;
            break;
          case 'assessmentUser':
            permissions.assessmentUser = true;
            break;
          case 'assessmentsAdmin':
            permissions.assessmentsAdmin = true;
            break;
          case 'employeeVerificationAdmin':
            permissions.employeeVerificationAdmin = true;
            break;
          case 'grievancesAdmin':
            permissions.grievancesAdmin = true;
            break;
          case 'transportSafetyAdmin':
            permissions.transportSafetyAdmin = true;
            break;
          case 'eduSafeResourceAccess':
            permissions.eduSafeResourceAccess = true;
            break;
        }
      }
    });

    return permissions;
  };

  // Add a new client
  const addClient = async (clientData: Omit<Client, 'id' | 'creationDate'>) => {
    setLoading(true);
    try {
      // First save the client data
      const dbClient = prepareClientForDb(clientData as Client);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Now save the module access to client_modules table
        const moduleEntries = Object.entries(clientData.moduleAccess || {});
        
        // Prepare module entries for insertion
        const moduleInserts = moduleEntries
          .filter(([_, enabled]) => enabled) // Only include enabled modules
          .map(([key, _]) => ({
            client_id: data.id,
            module_key: key,
            enabled: true
          }));
        
        if (moduleInserts.length > 0) {
          const { error: moduleError } = await supabase
            .from('client_modules')
            .insert(moduleInserts);
          
          if (moduleError) {
            console.error('Error saving client modules:', moduleError);
            toast.error('Client created but module access could not be saved');
          }
        }

        // Add the new client to state
        const newClient = {
          ...mapDbClientToClient(data),
          moduleAccess: clientData.moduleAccess
        };
        
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
      
      // Update client record
      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Handle module access updates
      if (updates.moduleAccess) {
        // Delete existing module entries
        const { error: deleteError } = await supabase
          .from('client_modules')
          .delete()
          .eq('client_id', id);
        
        if (deleteError) {
          console.error('Error deleting existing client modules:', deleteError);
        }
        
        // Add new module entries
        const moduleEntries = Object.entries(updates.moduleAccess);
        
        // Prepare module entries for insertion
        const moduleInserts = moduleEntries
          .filter(([_, enabled]) => enabled) // Only include enabled modules
          .map(([key, _]) => ({
            client_id: id,
            module_key: key,
            enabled: true
          }));
        
        if (moduleInserts.length > 0) {
          const { error: moduleError } = await supabase
            .from('client_modules')
            .insert(moduleInserts);
          
          if (moduleError) {
            console.error('Error saving client modules:', moduleError);
            toast.error('Client updated but module access could not be updated');
          }
        }
      }

      // Update client in state
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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
      // Delete from client_modules first (foreign key constraint)
      const { error: moduleError } = await supabase
        .from('client_modules')
        .delete()
        .eq('client_id', id);
      
      if (moduleError) {
        console.error('Error deleting client modules:', moduleError);
      }

      // Then delete the client
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
