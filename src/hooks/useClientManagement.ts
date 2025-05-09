
import { useState } from 'react';
import { Client, useClient, InstitutionType } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';

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

  const handleAddClient = async () => {
    await addClient(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (client: Client) => {
    setCurrentClient(client);
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
      institutionType: client.institutionType || 'Other',
      allowedDomains: client.allowedDomains || [],
      authProviders: {
        google: client.authProviders?.google ?? false,
        microsoft: client.authProviders?.microsoft ?? false,
        zoho: client.authProviders?.zoho ?? false
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (currentClient) {
      await updateClient(currentClient.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
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
