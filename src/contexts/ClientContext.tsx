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
  superAdminAllowedDomains?: string[]; 
  superAdminEmail?: string; // Added property
  authProviders?: {
    [key in OAuthProviderName]?: boolean;
  };
}

// Define ModuleInfo interface for consistent type handling
export interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

interface ClientContextType {
  client: Client | null;
  clients: Client[];
  loading: boolean;
  setClient: (client: Client | null) => void;
  addClient: (clientData: Omit<Client, 'id' | 'creationDate'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean;
}

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
      if (module.enabled && module.access_level && module.module_id) {
        // Map the module to the appropriate permission based on access_level
        // This will depend on your module structure in the database
        
        // For example:
        // If you have a mapping of module_id to permission name, you would use that here
        // Since we don't have the exact mapping, we'll rely on the fact that your
        // module_id should correspond to a specific permission
        
        // Assuming access_level contains an isAdmin field
        const isAdmin = module.access_level.isAdmin || false;
        
        // You'll need to replace this with your actual module mapping logic
        // based on the module_id values in your database
        switch (module.module_id) {
          case 'your-superadmin-module-id':
            permissions.superAdmin = true;
            break;
          case 'your-incident-reporting-module-id':
            permissions.incidentReporting = true;
            break;
          // Add more cases as needed
          default:
            // If you don't have an exact mapping yet, you can log it
            console.log(`Unknown module_id: ${module.module_id}`);
            break;
        }
      }
    });

    return permissions;
  };

  // Check if an email domain is allowed for a specific client
  const isEmailDomainAllowed = (email: string, clientId: string): boolean => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.allowedDomains || client.allowedDomains.length === 0) {
      return true; // If no domains are specified, allow all
    }

    const emailDomain = email.split('@')[1].toLowerCase();
    return client.allowedDomains.some(domain => 
      domain.toLowerCase() === emailDomain
    );
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
        // Now prepare module access data
        if (clientData.moduleAccess) {
          // Convert module permissions to module info array
          const moduleInfoArray = Object.entries(clientData.moduleAccess)
            .filter(([_, enabled]) => enabled) // Only include enabled modules
            .map(([key, _]) => ({
              name: key, // Use the key as the module name
              module_id: "", // Will be looked up in the edge function
              is_admin: key.includes("Admin") // Assume modules with "Admin" are admin modules
            }));

          // Call the client-management edge function to handle modules
          const { error: modulesError } = await supabase.functions.invoke('client-management', {
            body: { 
              operation: 'create',
              client: {
                id: data.id, 
                moduleAccess: clientData.moduleAccess,
                modules: moduleInfoArray,
                superAdminEmail: clientData.superAdminEmail
              }
            }
          });
          
          if (modulesError) {
            console.error('Error saving client modules:', modulesError);
            toast.error('Client created but module access could not be saved');
          }
        }

        // Add the new client to state
        const newClient = {
          ...mapDbClientToClient(data),
          moduleAccess: clientData.moduleAccess,
          superAdminAllowedDomains: clientData.superAdminAllowedDomains,
          superAdminEmail: clientData.superAdminEmail // Make sure to include this property
        };
        
        setClients(prev => [...prev, newClient]);
        toast.success('Client added successfully');
        
        // Return the newly created client for further processing
        return newClient;
      }
      return null;
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
      return null;
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

      // Handle module access updates through edge function
      if (updates.moduleAccess) {
        // Convert module permissions to module info array
        const moduleInfoArray = Object.entries(updates.moduleAccess)
          .filter(([_, enabled]) => enabled) // Only include enabled modules
          .map(([key, _]) => ({
            name: key, // Use the key as the module name
            module_id: "", // Will be looked up in the edge function
            is_admin: key.includes("Admin") // Assume modules with "Admin" are admin modules
          }));

        // Call client-management edge function for module handling
        const { error: modulesError } = await supabase.functions.invoke('client-management', {
          body: { 
            operation: 'update',
            client: {
              id: id, 
              moduleAccess: updates.moduleAccess,
              modules: moduleInfoArray,
              superAdminEmail: updates.superAdminEmail
            }
          }
        });
        
        if (modulesError) {
          console.error('Error updating client modules:', modulesError);
          toast.error('Client updated but module access could not be updated');
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
      // First delete super admin employees
      const { error: employeeError } = await supabase
        .from('employees')
        .delete()
        .eq('client_id', id)
        .eq('is_super_admin', true);
      
      if (employeeError) {
        console.error('Error deleting super admin employees:', employeeError);
        // Continue with client deletion anyway
      }

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
      deleteClient,
      isEmailDomainAllowed
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

// Export types
export type { ClientContextType };
