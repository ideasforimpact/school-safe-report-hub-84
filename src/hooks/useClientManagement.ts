
import { useState } from 'react';
import { Client, useClient, InstitutionType, ModuleInfo } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  clientTypeId?: string; // Added this missing property
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
  superAdminAllowedDomains: string[];
  moduleInfoArray?: ModuleInfo[]; // Only keeping the moduleInfoArray property
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
  clientTypeId: '', // Added this to initial form data
  authProviders: {
    google: false,
    microsoft: false,
    zoho: false
  },
  superAdminAllowedDomains: [],
  moduleInfoArray: [] // Initialize moduleInfoArray as empty array
};

export const useClientManagement = () => {
  const { clients, loading, addClient, updateClient, deleteClient } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({...initialFormData});

  const resetForm = () => {
    setFormData({...initialFormData});
    setCurrentClient(null);
  };

  // Check if super admin email domain is allowed
  const isSuperAdminEmailDomainAllowed = (email: string, allowedDomains: string[]): boolean => {
    if (!email || allowedDomains.length === 0) return true; // If no restrictions, allow all
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    
    return allowedDomains.some(domain => domain.toLowerCase() === emailDomain);
  };

  const createEmployeeFromSuperAdminEmail = async (clientId: string, superAdminEmail: string) => {
    try {
      // Extract employee_id from the email (part before @ symbol)
      const employeeId = superAdminEmail.split('@')[0];
      
      // Create the employee record
      const employeeData = {
        employee_id: employeeId,
        first_name: employeeId, // Using the part before @ as first name
        last_name: '', // Empty last name
        email: superAdminEmail,
        department: 'Admin',
        employee_type: 'permanent',
        status: true,
        is_super_admin: true,
        client_id: clientId,
        joining_date: new Date().toISOString()
      };

      // Check if employee already exists with this email and client_id
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', superAdminEmail)
        .eq('client_id', clientId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing employee:', checkError);
        toast.error('Failed to check for existing employee');
        return null;
      }

      // If employee exists, return the existing record
      if (existingEmployee) {
        //console.log('Employee already exists for this client:', existingEmployee);
        return existingEmployee;
      }

      // Insert new employee
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();

      if (error) {
        console.error('Error creating employee from super admin email:', error);
        toast.error('Failed to create super admin employee');
        return null;
      }

      //console.log('Created new super admin employee:', data[0]);
      return data[0];
    } catch (err) {
      console.error('Error in createEmployeeFromSuperAdminEmail:', err);
      return null;
    }
  };

  const updateEmployeeFromSuperAdminEmail = async (clientId: string, superAdminEmail: string) => {
    try {
      // Check if a super admin employee already exists for this client
      const { data: existingEmployee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_super_admin', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No super admin exists, create one
          return await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
        }
        console.error('Error checking for existing employee:', error);
        return null;
      }

      // If email hasn't changed, just return the existing employee
      if (existingEmployee.email === superAdminEmail) {
        return existingEmployee;
      }
      
      // Update the existing employee with the new email
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
        toast.error('Failed to update super admin email');
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in updateEmployeeFromSuperAdminEmail:', err);
      return null;
    }
  };

  // Update prepareModuleInfoArray to not depend on moduleAccess
  const prepareModuleInfoArray = (): ModuleInfo[] => {
    // When using moduleInfoArray directly, we don't need this function to convert from moduleAccess
    // It will now just return an empty array as the ModuleAccessTab component handles this
    return [];
  };

  const handleAddClient = async () => {
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    // Check if super admin email domain is allowed
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }
    
    try {
      // Use moduleInfoArray directly from formData
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      //console.log('Module info for client creation:', moduleInfoArray);
      
      // First, add the client and get the client object back with proper typing
      const result = await addClient({
        ...formData,
        modules: moduleInfoArray  // Pass the moduleInfoArray directly
      });
      
      const newClient = result as Client; // Cast to Client type
      
      if (newClient && newClient.id) {
        // Now create the employee from super admin email
        await createEmployeeFromSuperAdminEmail(newClient.id, formData.superAdminEmail);
        toast.success('Client and super admin employee created successfully');
      } else {
        toast.error('Failed to create client - no client ID returned');
      }
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleAddClient:', error);
      toast.error('Failed to add client');
    }
  };

  const handleEditClick = (client: Client) => {
    setCurrentClient(client);
    
    // Get the client modules and super admin employee for this client
    const fetchClientData = async (clientId: string) => {
      try {
        // Fetch client modules
        //console.log("Fetching client modules for edit", clientId);
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
          // Since the name isn't directly in client_modules, fetch it from modules table
          // For now, use a default empty string as a placeholder
          const moduleName = '';
          
          // Safely access access_level properties
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
        
        // Set the form data with all information
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
    
    try {
      // Use moduleInfoArray directly from formData
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      //console.log('Module info for client update:', moduleInfoArray);
      
      // Step 1: Delete all existing client modules (keep this part)
      const { error: deleteError } = await supabase
        .from('client_modules')
        .delete()
        .eq('client_id', currentClient.id);
        
      if (deleteError) {
        console.error('Error deleting existing client modules:', deleteError);
        toast.error('Failed to update client modules');
        return;
      }
      
      // Step 2: Update the client in database
      await updateClient(currentClient.id, {
        ...formData,
        modules: moduleInfoArray  // Pass the moduleInfoArray directly
      });
      
      // Step 3: Update or create the super admin employee
      await updateEmployeeFromSuperAdminEmail(currentClient.id, formData.superAdminEmail);
      
      toast.success('Client and super admin employee updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleUpdateClient:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient(id);
    }
  };

  return {
    clients,
    loading,
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
