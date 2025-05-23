
import React from 'react';
import { useAuth } from '@/contexts/auth';
import UserList from '@/components/users/UserList';

const UserManagementContent = () => {
  const { users, updateUser, deleteUser, deactivateUser, reactivateUser } = useAuth();

  const handleEditClick = (user: any) => {
    console.log('Edit user:', user);
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  };

  const handleDeactivateUser = (id: string) => {
    deactivateUser(id);
  };

  const handleReactivateUser = (id: string) => {
    reactivateUser(id);
  };

  return (
    <div className="space-y-6">
      <UserList
        users={users}
        onEditClick={handleEditClick}
        onDeleteUser={handleDeleteUser}
        onDeactivateUser={handleDeactivateUser}
        onReactivateUser={handleReactivateUser}
      />
    </div>
  );
};

export default UserManagementContent;
