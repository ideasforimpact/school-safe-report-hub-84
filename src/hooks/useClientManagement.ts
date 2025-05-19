import { useState } from 'react';
import { Client, useClient, InstitutionType, ModuleInfo } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface ClientFormData {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  moduleAccess: Partial<ModulePermissions>;
  active: boolean;
  logo: string;
  institutionType: InstitutionType;
  allowedDomains: string[];
  superAdminEmail: string;
  website?: string;
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
  superAdminAllowedDomains: string[];
  moduleInfoArray?: ModuleInfo[]; // Add the moduleInfoArray property
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  contactPerson: '',
  phone: '',
  moduleAccess: {
    superAdmin: false,
    incidentReporting: true,
    incidentAdmin: false,
    assessmentUser: true,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: true
  },
  active: true,
  logo: '',
  institutionType: 'Other',
  allowedDomains: [],
  superAdminEmail: '',
  website: '',
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
        console.log('Employee already exists for this client:', existingEmployee);
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

      console.log('Created new super admin employee:', data[0]);
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

  // Fix the function that prepares module info array
  const prepareModuleInfoArray = (moduleAccess: Partial<ModulePermissions>): ModuleInfo[] => {
    // Create module info array from moduleAccess
    return Object.entries(moduleAccess)
      .filter(([_, enabled]) => enabled) // Only include enabled modules
      .map(([key, _]) => {
        const isAdmin = key.includes("Admin");
        // Use base name without "Admin" suffix for more consistent naming
        const baseName = key.replace("Admin", "");
        
        return {
          name: key, // Use the key as the module name for identification
          module_id: "", // Will be looked up in the edge function
          is_admin: isAdmin // Modules with "Admin" in name are admin modules
        };
      });
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
      // Use moduleInfoArray if available, or create it from moduleAccess
      const moduleInfoArray = formData.moduleInfoArray || prepareModuleInfoArray(formData.moduleAccess);
      
      console.log('Module info for client creation:', moduleInfoArray);
      
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
        console.log("Fetching client modules for edit", clientId);
        const { data: clientModulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select('*')
          .eq('client_id', clientId);
          
        if (modulesError) {
          console.error('Error fetching client modules:', modulesError);
          toast.error('Failed to load client modules data');
        }
        
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
        
        // If we have client modules data, prepare moduleInfoArray
        let moduleInfoArray: ModuleInfo[] = [];
        if (clientModulesData && clientModulesData.length > 0) {
          // Get module details for each client_module
          const moduleIds = clientModulesData.map(cm => cm.module_id);
          const { data: modulesData } = await supabase
            .from('modules')
            .select('*')
            .in('id', moduleIds);
            
          // Create a mapping of module ids to names
          const moduleMap = new Map();
          if (modulesData) {
            modulesData.forEach(module => {
              moduleMap.set(module.id, module.name);
            });
          }
          
          // Now create the module info array with complete information
          moduleInfoArray = clientModulesData.map(cm => {
            // Parse access_level if it's a string
            let accessLevel: any = cm.access_level;
            if (typeof accessLevel === 'string') {
              try {
                accessLevel = JSON.parse(accessLevel);
              } catch (e) {
                accessLevel = {};
              }
            }
            
            // Make sure we properly handle the access level object
            const isAdmin = typeof accessLevel === 'object' && accessLevel !== null 
              ? !!accessLevel.isAdmin 
              : false;
            
            return {
              name: moduleMap.get(cm.module_id) || "Unknown Module",
              module_id: cm.module_id,
              is_admin: isAdmin
            };
          });
          
          console.log("Built moduleInfoArray for editing:", moduleInfoArray);
        }
        
        // Now set the form data with all information
        setFormData({
          name: client.name,
          email: client.email,
          contactPerson: client.contactPerson,
          phone: client.phone,
          moduleAccess: {
            superAdmin: client.moduleAccess?.superAdmin ?? false,
            incidentReporting: client.moduleAccess?.incidentReporting ?? true,
            incidentAdmin: client.moduleAccess?.incidentAdmin ?? false,
            assessmentUser: client.moduleAccess?.assessmentUser ?? true,
            assessmentsAdmin: client.moduleAccess?.assessmentsAdmin ?? false,
            employeeVerificationAdmin: client.moduleAccess?.employeeVerificationAdmin ?? false,
            grievancesAdmin: client.moduleAccess?.grievancesAdmin ?? false,
            transportSafetyAdmin: client.moduleAccess?.transportSafetyAdmin ?? false,
            eduSafeResourceAccess: client.moduleAccess?.eduSafeResourceAccess ?? true
          },
          active: client.active,
          logo: client.logo || '',
          institutionType: (client.institutionType as InstitutionType) || 'Other',
          allowedDomains: client.allowedDomains || [],
          superAdminEmail: employeeData?.email || '',
          superAdminAllowedDomains: client.superAdminAllowedDomains || [], 
          authProviders: {
            google: client.authProviders?.google ?? false,
            microsoft: client.authProviders?.microsoft ?? false,
            zoho: client.authProviders?.zoho ?? false
          },
          moduleInfoArray: moduleInfoArray // Set the moduleInfoArray with the data from the database
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
      // Use moduleInfoArray if available, or create it from moduleAccess
      const moduleInfoArray = formData.moduleInfoArray || prepareModuleInfoArray(formData.moduleAccess);
      
      console.log('Module info for client update:', moduleInfoArray);
      
      // Step 1: Delete all existing client modules
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
