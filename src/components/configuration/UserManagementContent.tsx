
import React from 'react';
import { useAuth } from '@/contexts/auth';
import UserList from '@/components/users/UserList';
import { EmployeeUser } from '@/pages/UserManagement';

const UserManagementContent = () => {
  const { users, updateUser, deleteUser, deactivateUser, reactivateUser } = useAuth();

  const handleEditClick = (user: EmployeeUser) => {
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

  // Convert User[] to EmployeeUser[] by ensuring required properties exist
  const employeeUsers: EmployeeUser[] = users.map(user => ({
    ...user,
    createdAt: user.createdAt || new Date().toISOString(),
    role: user.role || 'user' as const
  }));

  return (
    <div className="space-y-6">
      <UserList
        users={employeeUsers}
        onEditClick={handleEditClick}
        onDeleteUser={handleDeleteUser}
        onDeactivateUser={handleDeactivateUser}
        onReactivateUser={handleReactivateUser}
      />
    </div>
  );
};

export default UserManagementContent;
