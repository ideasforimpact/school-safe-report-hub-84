
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
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

const ClientManagement = () => {
  const { isAdmin } = useAuth();
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
    setStatusFilter
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
        <ClientHeader onAddClick={handleAddDialogOpen} />

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Manage your clients and their module access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientStatusFilter 
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : (
              <ClientList 
                clients={clients}
                onEditClick={handleEditClick}
                onDeleteClient={handleDeleteClient}
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
