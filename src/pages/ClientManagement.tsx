
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useClientManagement from '@/hooks/useClientManagement';
import ClientHeader from '@/components/clients/ClientHeader';
import ClientList from '@/components/clients/ClientList';
import ClientDialog from '@/components/backoffice/ClientDialog';
import ClientStatusFilter from '@/components/clients/ClientStatusFilter';
import { Loader2 } from 'lucide-react';
import Loader from '@/components/common/Loader';

const ClientManagement = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    clients,
    loading,
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleAddClient,
    handleEditClick,
    handleUpdateClient,
    handleDeleteClient,
    resetForm,
    handleAddDialogOpen,
    modulesLoading,
    editLoading,
    statusFilter,
    setStatusFilter,
    clientManagementReadOnly,
    canManageClientsInCurrentContext,
  } = useClientManagement();

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ClientHeader onAddClick={handleAddDialogOpen} canCreateClient={canManageClientsInCurrentContext} />

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Manage your clients and their module access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientManagementReadOnly && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Switched client context is read-only for Client Management. Switch back to your Head Office client to add or edit clients.
              </div>
            )}
            <ClientStatusFilter 
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader text="Loading clients..." />
              </div>
            ) : (
              <ClientList 
                clients={clients}
                onViewApiCalls={(client) =>
                  navigate(`/backoffice/clients/${client.id}/api-calls`, {
                    state: { clientName: client.name },
                  })}
                onEditClick={handleEditClick}
                onDeleteClient={handleDeleteClient}
                canEditClient={canManageClientsInCurrentContext}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <ClientDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddClient}
        onCancel={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        isEdit={false}
        isLoading={loading}
        modulesLoading={modulesLoading}
      />

      {/* Edit Client Dialog */}
      <ClientDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateClient}
        onCancel={() => {
          setIsEditDialogOpen(false);
          resetForm();
        }}
        isEdit={true}
        isLoading={loading || editLoading}
      />
    </Layout>
  );
};

export default ClientManagement;
