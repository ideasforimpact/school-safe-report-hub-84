
import { useState } from 'react';
import { Client, useClient } from '@/contexts/ClientContext';

export interface ClientFormData {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  moduleAccess: {
    incidentReporting: boolean;
    allIncidents: boolean;
    insights: boolean;
    benchmarking: boolean;
  };
  active: boolean;
  logo: string;
  allowedDomains: string[];
  authProviders: {
    google: boolean;
    microsoft: boolean;
    zoho: boolean;
  };
}

export const useClientManagement = () => {
  const { clients, addClient, updateClient, deleteClient } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    moduleAccess: {
      incidentReporting: true,
      allIncidents: true,
      insights: true,
      benchmarking: false
    },
    active: true,
    logo: '',
    allowedDomains: [],
    authProviders: {
      google: false,
      microsoft: false,
      zoho: false
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contactPerson: '',
      phone: '',
      moduleAccess: {
        incidentReporting: true,
        allIncidents: true,
        insights: true,
        benchmarking: false
      },
      active: true,
      logo: '',
      allowedDomains: [],
      authProviders: {
        google: false,
        microsoft: false,
        zoho: false
      }
    });
    setCurrentClient(null);
  };

  const handleAddClient = () => {
    addClient(formData);
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
        incidentReporting: client.moduleAccess?.incidentReporting ?? true,
        allIncidents: client.moduleAccess?.allIncidents ?? true,
        insights: client.moduleAccess?.insights ?? true,
        benchmarking: client.moduleAccess?.benchmarking ?? false
      },
      active: client.active,
      logo: client.logo || '',
      allowedDomains: client.allowedDomains || [],
      authProviders: {
        google: client.authProviders?.google ?? false,
        microsoft: client.authProviders?.microsoft ?? false,
        zoho: client.authProviders?.zoho ?? false
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = () => {
    if (currentClient) {
      updateClient(currentClient.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  return {
    clients,
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
