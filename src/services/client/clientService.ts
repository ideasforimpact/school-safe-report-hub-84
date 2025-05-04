
import { Client } from '@/contexts/ClientContext';
import { toast } from "@/components/ui/sonner";

/**
 * Add a new client
 */
export const addClient = (
  clients: Client[],
  clientData: Omit<Client, 'id' | 'creationDate'>
): Client[] => {
  const newClient: Client = {
    ...clientData,
    id: Date.now().toString(),
    creationDate: new Date().toISOString(),
  };

  const updatedClients = [...clients, newClient];
  toast.success("Client added successfully");
  return updatedClients;
};

/**
 * Update an existing client
 */
export const updateClient = (
  clients: Client[],
  id: string, 
  updates: Partial<Client>
): Client[] => {
  const updatedClients = clients.map(client => {
    if (client.id === id) {
      return { ...client, ...updates };
    }
    return client;
  });
  
  toast.success("Client updated successfully");
  return updatedClients;
};

/**
 * Delete a client
 */
export const deleteClient = (
  clients: Client[],
  id: string
): Client[] => {
  const updatedClients = clients.filter(client => client.id !== id);
  toast.success("Client deleted successfully");
  return updatedClients;
};

/**
 * Get a client by ID
 */
export const getClientById = (
  clients: Client[],
  id: string
): Client | undefined => {
  return clients.find(client => client.id === id);
};

/**
 * Validate if an email domain is allowed for a client
 */
export const isEmailDomainAllowed = (
  email: string,
  client: Client | undefined
): boolean => {
  if (!client || !client.allowedDomains || client.allowedDomains.length === 0) {
    return false;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return client.allowedDomains.some(allowedDomain => 
    allowedDomain.toLowerCase() === domain
  );
};

/**
 * Load clients from localStorage
 */
export const getClientsFromStorage = (): Client[] => {
  const savedClients = localStorage.getItem('clients');
  return savedClients ? JSON.parse(savedClients) : [];
};

/**
 * Save clients to localStorage
 */
export const saveClientsToStorage = (clients: Client[]): void => {
  localStorage.setItem('clients', JSON.stringify(clients));
};
