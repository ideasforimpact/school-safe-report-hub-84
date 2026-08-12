
import { Client } from '@/contexts/ClientContext';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { mapDbClientToClient, ClientRecord } from '@/types/clientTypes';

export type ClientStatusFilter = 'active' | 'inactive' | 'all';

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

/**
 * Fetch all client names from the database
 */
export const fetchClientNames = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        client_integration (
          is_linked,
          target_client_id,
          target_client_name
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Error in fetchClientNames:', error);
    throw error;
  }
};

export interface FetchClientsPageParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ClientStatusFilter;
}

export interface FetchClientsPageResult {
  clients: Client[];
  total: number;
}

// Filtering/paging happen in the edge function so the full client table is never pulled to the browser.
export const fetchClientsPage = async ({
  page,
  pageSize,
  search,
  status = 'active',
}: FetchClientsPageParams): Promise<FetchClientsPageResult> => {
  const { data: response, error } = await supabase.functions.invoke('backoffice-client-management', {
    // Only this caller needs super admin emails / incidents-lock data
    // (for the Edit Client dialog), so it's the only one that opts in —
    // other callers of this same action (ClientContext, BasicInfoTab's
    // head-office mapping dropdown) don't pay for those extra joins.
    body: { action: 'fetch-clients', page, pageSize, search, status, includeSuperAdminData: true },
  });

  if (error) throw error;

  const rows: Array<ClientRecord & {
    incident_recommended_actions_enabled?: boolean;
    super_admin_email?: string | null;
    secondary_super_admin_emails?: string[];
    has_incidents?: boolean;
  }> = Array.isArray(response?.data) ? response.data : [];
  const clients: Client[] = rows.map((dbClient) => ({
    ...mapDbClientToClient(dbClient),
    clientTypeId: dbClient.client_type_id,
    incidentRecommendedActionsEnabled: dbClient.incident_recommended_actions_enabled !== false,
    superAdminEmail: dbClient.super_admin_email || undefined,
    secondarySuperAdminEmails: dbClient.secondary_super_admin_emails || [],
    hasIncidents: dbClient.has_incidents === true,
  }));

  return { clients, total: typeof response?.total === 'number' ? response.total : clients.length };
};
