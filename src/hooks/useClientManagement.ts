
import { useState } from 'react';
import { Client, useClient, InstitutionType } from '@/contexts/ClientContext';
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
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
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
  authProviders: {
    google: false,
    microsoft: false,
    zoho: false
  }
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

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();

      if (error) {
        console.error('Error creating employee from super admin email:', error);
        toast.error('Failed to create super admin employee');
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Error in createEmployeeFromSuperAdminEmail:', err);
      return null;
    }
  };

  const handleAddClient = async () => {
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    try {
      // Fix for TypeScript error: Explicitly type the return value of addClient
      const newClient = await addClient(formData) as Client | undefined;
      
      if (newClient && newClient.id) {
        // Now create the employee from super admin email
        await createEmployeeFromSuperAdminEmail(newClient.id, formData.superAdminEmail);
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
    
    // Get the super admin employee for this client
    const getSuperAdminEmail = async (clientId: string) => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('email')
          .eq('client_id', clientId)
          .eq('is_super_admin', true)
          .single();
          
        if (error) {
          console.log('No super admin employee found for this client');
          return '';
        }
        
        return data?.email || '';
      } catch (err) {
        console.error('Error fetching super admin email:', err);
        return '';
      }
    };
    
    getSuperAdminEmail(client.id).then(superAdminEmail => {
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
        superAdminEmail: superAdminEmail,
        authProviders: {
          google: client.authProviders?.google ?? false,
          microsoft: client.authProviders?.microsoft ?? false,
          zoho: client.authProviders?.zoho ?? false
        }
      });
      
      setIsEditDialogOpen(true);
    });
  };

  const handleUpdateClient = async () => {
    if (!currentClient) {
      return;
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    try {
      // Update the client first
      await updateClient(currentClient.id, formData);
      
      // Check if we need to update or create the super admin employee
      const { data: existingEmployee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('client_id', currentClient.id)
        .eq('is_super_admin', true)
        .single();
      
      if (error || !existingEmployee) {
        // No super admin exists, create one
        await createEmployeeFromSuperAdminEmail(currentClient.id, formData.superAdminEmail);
      } else if (existingEmployee.email !== formData.superAdminEmail) {
        // Update the existing super admin's email
        const employeeId = formData.superAdminEmail.split('@')[0];
        
        await supabase
          .from('employees')
          .update({ 
            email: formData.superAdminEmail,
            employee_id: employeeId,
            first_name: employeeId
          })
          .eq('id', existingEmployee.id);
      }
      
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
    resetForm
  };
};

export default useClientManagement;
