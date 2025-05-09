
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useUserManagement } from '@/features/user-management/hooks/useUserManagement';
import UserManagementHeader from '@/features/user-management/components/UserManagementHeader';
import UserManagementContent from '@/features/user-management/components/UserManagementContent';
import AccessDeniedCard from '@/features/user-management/components/AccessDeniedCard';
import UserDialogs from '@/features/user-management/components/UserDialogs';

const UserManagement = () => {
  const {
    users,
    isAdmin,
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleAddUser,
    handleEditClick,
    handleUpdateUser,
    handleDeleteUser,
    handleDeactivateUser,
    handleReactivateUser,
    resetForm
  } = useUserManagement();

  if (!isAdmin) {
    return (
      <Layout>
        <AccessDeniedCard />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <UserManagementHeader onAddUser={() => setIsAddDialogOpen(true)} />
        <UserManagementContent 
          users={users}
          onEditClick={handleEditClick}
          onDeleteUser={handleDeleteUser}
          onDeactivateUser={handleDeactivateUser}
          onReactivateUser={handleReactivateUser}
        />
      </div>

      <UserDialogs 
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onAddSubmit={handleAddUser}
        onEditSubmit={handleUpdateUser}
        resetForm={resetForm}
      />
    </Layout>
  );
};

export default UserManagement;
