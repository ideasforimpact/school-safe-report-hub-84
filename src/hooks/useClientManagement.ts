import { useState } from 'react';
import { Client, useClient, InstitutionType, ModuleInfo } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useClientManagement = () => {
  const { clients, loading, addClient, updateClient, deleteClient } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({...initialFormData});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({...initialFormData});
    setCurrentClient(null);
  };

  // Simple function to open add dialog (no pre-generated ID)
  const handleAddDialogOpen = () => {
    setIsAddDialogOpen(true);
  };

  // Check if super admin email domain is allowed
  const isSuperAdminEmailDomainAllowed = (email: string, allowedDomains: string[]): boolean => {
    if (!email || allowedDomains.length === 0) return true;
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    
    return allowedDomains.some(domain => domain.toLowerCase() === emailDomain);
  };

  // ... keep existing code (createEmployeeFromSuperAdminEmail and updateEmployeeFromSuperAdminEmail functions)

  const handleAddClient = async () => {
    // Prevent duplicate calls - check submission state first
    if (isSubmitting) {
      console.log('Add client submission already in progress, skipping...');
      return; 
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    // Check if super admin email domain is allowed
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }

    // Ensure we have modules data before submitting
    if (!formData.moduleInfoArray || formData.moduleInfoArray.length === 0) {
      toast.error('Please wait for modules to load before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      console.log('Module info for client creation:', moduleInfoArray);
      console.log('Logo data being sent:', {
        hasLogo: !!formData.logo,
        logoType: typeof formData.logo,
        logoLength: formData.logo ? formData.logo.length : 0,
        logoPreview: formData.logo ? formData.logo.substring(0, 50) + '...' : 'No logo'
      });
      
      // Don't send ID - let the edge function generate it
      const requestPayload = {
        operation: 'create',
        client: {
          modules: moduleInfoArray,
          superAdminEmail: formData.superAdminEmail,
          clientTypeId: formData.clientTypeId,
          logo: formData.logo || null,
          // Include all the form data
          name: formData.name,
          email: formData.email,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          active: formData.active,
          institutionType: formData.institutionType,
          allowedDomains: formData.allowedDomains,
          superAdminAllowedDomains: formData.superAdminAllowedDomains,
          authProviders: formData.authProviders
        }
      };
      
      console.log('Full request payload being sent:', {
        operation: requestPayload.operation,
        client: {
          ...requestPayload.client,
          logo: requestPayload.client.logo ? 'Logo data present (length: ' + requestPayload.client.logo.length + ')' : 'No logo data'
        }
      });
      
      // Call the edge function with all client data
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: requestPayload
      });
      
      if (error) {
        console.error('Error creating client:', error);
        toast.error('Failed to create client');
        return;
      }
      
      // Add the client to the database with basic info
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
    
    // Get the client modules and super admin employee for this client
    const fetchClientData = async (clientId: string) => {
      try {
        // Fetch client modules
        console.log("Fetching client modules for edit", clientId);
        const { data: clientModulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select('*')
          .eq('client_id', clientId);
          
        if (modulesError) {
          console.error('Error fetching client modules:', modulesError);
          toast.error('Failed to load client modules data');
        }
        
        // Transform client modules data to moduleInfoArray
        const moduleInfoArray = clientModulesData ? clientModulesData.map(module => {
          const moduleName = '';
          const accessLevel = module.access_level as Record<string, any> || {};
          const isAdmin = typeof accessLevel === 'object' && accessLevel !== null ? 
            !!accessLevel.isAdmin : false;
          
          return {
            name: moduleName,
            module_id: module.module_id || '',
            is_admin: isAdmin
          };
        }) : [];
        
        // Fetch super admin email
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
        
        // Set the form data with all information - preserve existing logo
        setFormData({
          name: client.name,
          email: client.email,
          contactPerson: client.contactPerson,
          phone: client.phone,
          active: client.active,
          logo: client.logo || '', // Keep existing logo data
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
    // Prevent duplicate calls - check submission state first
    if (isSubmitting) {
      console.log('Update client submission already in progress, skipping...');
      return; 
    }
    
    if (!currentClient) {
      return;
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    // Check if super admin email domain is allowed
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      console.log('Module info for client update:', moduleInfoArray);
      console.log('Logo data being sent for update:', {
        hasLogo: !!formData.logo,
        logoType: typeof formData.logo,
        logoLength: formData.logo ? formData.logo.length : 0,
        logoPreview: formData.logo ? formData.logo.substring(0, 50) + '...' : 'No logo'
      });
      
      // Always include logo data in the request, whether it's new, existing, or empty
      const requestPayload = {
        operation: 'update',
        client: {
          id: currentClient.id,
          modules: moduleInfoArray,
          superAdminEmail: formData.superAdminEmail,
          clientTypeId: formData.clientTypeId,
          logo: formData.logo || '' // Always send logo data, even if empty string
        }
      };
      
      console.log('Full update request payload being sent:', {
        operation: requestPayload.operation,
        client: {
          ...requestPayload.client,
          logo: requestPayload.client.logo ? 'Logo data present (length: ' + requestPayload.client.logo.length + ')' : 'No logo data'
        }
      });
      
      // Call the edge function with logo data - ensure single call
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: requestPayload
      });
      
      if (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client via edge function');
        return;
      }
      
      // Update the client in database
      await updateClient(currentClient.id, {
        ...formData,
        modules: moduleInfoArray
      });
      
      // Update or create the super admin employee
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
    isSuperAdminEmailDomainAllowed,
    handleAddDialogOpen
  };
};

export default useClientManagement;
