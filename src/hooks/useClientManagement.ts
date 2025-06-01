
import { useState, useEffect } from 'react';
import { InstitutionType } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  clientTypeId?: string;
  moduleAccess?: any;
  allowedDomains?: string[];
  superAdminAllowedDomains?: string[];
  superAdminEmail?: string;
  authProviders?: {
    [key in OAuthProviderName]?: boolean;
  };
}

export interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

export interface ClientFormData {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  active: boolean;
  logo: string;
  institutionType: InstitutionType;
  allowedDomains: string[];
  superAdminEmail: string;
  website?: string;
  clientTypeId?: string;
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
  superAdminAllowedDomains: string[];
  moduleInfoArray?: ModuleInfo[];
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  contactPerson: '',
  phone: '',
  active: true,
  logo: '',
  institutionType: 'Other',
  allowedDomains: [],
  superAdminEmail: '',
  website: '',
  clientTypeId: '',
  authProviders: {
    google: false,
    microsoft: false,
    zoho: false
  },
  superAdminAllowedDomains: [],
  moduleInfoArray: []
};

// Helper function to map database client to Client interface
const mapDbClientToClient = (dbClient: any): Client => {
  return {
    id: dbClient.id,
    name: dbClient.name || '',
    email: dbClient.email || '',
    contactPerson: dbClient.contact_person || '',
    phone: dbClient.phone || '',
    creationDate: dbClient.creation_date || new Date().toISOString(),
    active: dbClient.active !== undefined ? dbClient.active : true,
    logo: dbClient.logo || dbClient.client_logo || '',
    institutionType: dbClient.institution_type || 'Other',
    clientTypeId: dbClient.client_type_id || '',
    allowedDomains: dbClient.allowed_domains ? dbClient.allowed_domains.split(',').filter(Boolean) : [],
    superAdminAllowedDomains: dbClient.super_admin_allowed_domain ? dbClient.super_admin_allowed_domain.split(',').filter(Boolean) : [],
    authProviders: dbClient.auth_providers ? JSON.parse(dbClient.auth_providers) : {
      google: false,
      microsoft: false,
      zoho: false
    }
  };
};

// Helper function to prepare client data for database
const prepareClientForDb = (client: Partial<Client>) => {
  return {
    name: client.name,
    email: client.email,
    contact_person: client.contactPerson,
    phone: client.phone,
    active: client.active,
    logo: client.logo || null,
    client_logo: client.logo || null,
    institution_type: client.institutionType,
    client_type_id: client.clientTypeId || null,
    allowed_domains: client.allowedDomains?.length ? client.allowedDomains.join(',') : null,
    super_admin_allowed_domain: client.superAdminAllowedDomains?.length ? client.superAdminAllowedDomains.join(',') : null,
    auth_providers: client.authProviders ? JSON.stringify(client.authProviders) : null,
    creation_date: client.creationDate || new Date().toISOString()
  };
};

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({...initialFormData});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) {
          throw clientsError;
        }

        const mappedClients = clientsData.map(mapDbClientToClient);
        setClients(mappedClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const resetForm = () => {
    setFormData({...initialFormData});
    setCurrentClient(null);
  };

  // Check if super admin email domain is allowed
  const isSuperAdminEmailDomainAllowed = (email: string, allowedDomains: string[]): boolean => {
    if (!email || allowedDomains.length === 0) return true;
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    
    return allowedDomains.some(domain => domain.toLowerCase() === emailDomain);
  };

  const createEmployeeFromSuperAdminEmail = async (clientId: string, superAdminEmail: string) => {
    try {
      const employeeId = superAdminEmail.split('@')[0];
      
      const employeeData = {
        employee_id: employeeId,
        first_name: employeeId,
        last_name: '',
        email: superAdminEmail,
        department: 'Admin',
        employee_type: 'permanent',
        status: true,
        is_super_admin: true,
        client_id: clientId,
        joining_date: new Date().toISOString()
      };

      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', superAdminEmail)
        .eq('client_id', clientId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing employee:', checkError);
        return null;
      }

      if (existingEmployee) {
        return existingEmployee;
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();

      if (error) {
        console.error('Error creating employee from super admin email:', error);
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Error in createEmployeeFromSuperAdminEmail:', err);
      return null;
    }
  };

  const updateEmployeeFromSuperAdminEmail = async (clientId: string, superAdminEmail: string) => {
    try {
      const { data: existingEmployee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_super_admin', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
        }
        console.error('Error checking for existing employee:', error);
        return null;
      }

      if (existingEmployee.email === superAdminEmail) {
        return existingEmployee;
      }
      
      const employeeId = superAdminEmail.split('@')[0];
      
      const { data, error: updateError } = await supabase
        .from('employees')
        .update({
          email: superAdminEmail,
          employee_id: employeeId,
          first_name: employeeId
        })
        .eq('id', existingEmployee.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating employee email:', updateError);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in updateEmployeeFromSuperAdminEmail:', err);
      return null;
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'creationDate'> & { modules?: ModuleInfo[] }) => {
    try {
      const { modules, ...rest } = clientData;
      const dbClient = prepareClientForDb(rest as Client);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        if (modules && modules.length > 0) {
          const { error: modulesError } = await supabase.functions.invoke('client-management', {
            body: { 
              operation: 'create',
              client: {
                id: data.id, 
                moduleAccess: clientData.moduleAccess,
                modules: modules,
                superAdminEmail: clientData.superAdminEmail,
                clientTypeId: clientData.clientTypeId
              }
            }
          });
          
          if (modulesError) {
            console.error('Error saving client modules:', modulesError);
            toast.error('Client created but module access could not be saved');
          }
        }

        const newClient = {
          ...mapDbClientToClient(data),
          moduleAccess: clientData.moduleAccess,
          superAdminAllowedDomains: clientData.superAdminAllowedDomains,
          superAdminEmail: clientData.superAdminEmail,
          clientTypeId: clientData.clientTypeId
        };
        
        setClients(prev => [...prev, newClient]);
        toast.success('Client added successfully');
        return newClient;
      }
      return null;
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
      return null;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client> & { modules?: ModuleInfo[] }) => {
    try {
      const { modules, ...clientUpdates } = updates;
      
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const updatedClient = { ...existingClient, ...clientUpdates };
      const dbUpdates = prepareClientForDb(updatedClient);
      
      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      if (modules && modules.length > 0) {
        const { error: modulesError } = await supabase.functions.invoke('client-management', {
          body: { 
            operation: 'update',
            client: {
              id: id,
              moduleAccess: updates.moduleAccess,
              modules: modules,
              superAdminEmail: updates.superAdminEmail,
              clientTypeId: updates.clientTypeId
            }
          }
        });
        
        if (modulesError) {
          console.error('Error updating client modules:', modulesError);
          toast.error('Client updated but module access could not be updated');
        }
      }

      setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientUpdates } : c));
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error: employeeError } = await supabase
        .from('employees')
        .delete()
        .eq('client_id', id)
        .eq('is_super_admin', true);
      
      if (employeeError) {
        console.error('Error deleting super admin employees:', employeeError);
      }

      const { error: moduleError } = await supabase
        .from('client_modules')
        .delete()
        .eq('client_id', id);
      
      if (moduleError) {
        console.error('Error deleting client modules:', moduleError);
      }

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
    }
  };

  const handleAddClient = async () => {
    if (isSubmitting) {
      return; 
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      const clientId = uuidv4();
      
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: {
          operation: 'create',
          client: {
            id: clientId,
            modules: moduleInfoArray,
            superAdminEmail: formData.superAdminEmail,
            clientTypeId: formData.clientTypeId,
            logo: formData.logo || null
          }
        }
      });
      
      if (error) {
        console.error('Error creating client:', error);
        toast.error('Failed to create client');
        return;
      }
      
      const result = await addClient({
        ...formData,
        modules: moduleInfoArray
      });
      
      if (result) {
        toast.success('Client and super admin employee created successfully');
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error in handleAddClient:', error);
      toast.error('Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (client: Client) => {
    setCurrentClient(client);
    
    const fetchClientData = async (clientId: string) => {
      try {
        const { data: clientModulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select('*')
          .eq('client_id', clientId);
          
        if (modulesError) {
          console.error('Error fetching client modules:', modulesError);
          toast.error('Failed to load client modules data');
        }
        
        const moduleInfoArray = clientModulesData ? clientModulesData.map(module => {
          const accessLevel = module.access_level as Record<string, any> || {};
          const isAdmin = typeof accessLevel === 'object' && accessLevel !== null ? 
            !!accessLevel.isAdmin : false;
          
          return {
            name: '',
            module_id: module.module_id || '',
            is_admin: isAdmin
          };
        }) : [];
        
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('email')
          .eq('client_id', clientId)
          .eq('is_super_admin', true)
          .single();
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error fetching super admin email:', employeeError);
          toast.error('Failed to load super admin data');
        }
        
        setFormData({
          name: client.name,
          email: client.email,
          contactPerson: client.contactPerson,
          phone: client.phone,
          active: client.active,
          logo: client.logo || '',
          institutionType: (client.institutionType as InstitutionType) || 'Other',
          allowedDomains: client.allowedDomains || [],
          superAdminEmail: employeeData?.email || '',
          clientTypeId: client.clientTypeId || '',
          superAdminAllowedDomains: client.superAdminAllowedDomains || [], 
          authProviders: {
            google: client.authProviders?.google ?? false,
            microsoft: client.authProviders?.microsoft ?? false,
            zoho: client.authProviders?.zoho ?? false
          },
          moduleInfoArray: moduleInfoArray
        });
      } catch (err) {
        console.error('Error in fetchClientData:', err);
        toast.error('Failed to load client data for editing');
      }
      
      setIsEditDialogOpen(true);
    };
    
    fetchClientData(client.id);
  };

  const handleUpdateClient = async () => {
    if (isSubmitting) {
      return; 
    }
    
    if (!currentClient) {
      return;
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: {
          operation: 'update',
          client: {
            id: currentClient.id,
            modules: moduleInfoArray,
            superAdminEmail: formData.superAdminEmail,
            clientTypeId: formData.clientTypeId,
            logo: formData.logo || ''
          }
        }
      });
      
      if (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client via edge function');
        return;
      }
      
      await updateClient(currentClient.id, {
        ...formData,
        modules: moduleInfoArray
      });
      
      await updateEmployeeFromSuperAdminEmail(currentClient.id, formData.superAdminEmail);
      
      toast.success('Client and super admin employee updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleUpdateClient:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient(id);
    }
  };

  return {
    clients,
    loading: loading || isSubmitting,
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentClient,
    handleAddClient,
    handleEditClick,
    handleUpdateClient,
    handleDeleteClient,
    resetForm,
    isSuperAdminEmailDomainAllowed
  };
};

export default useClientManagement;
