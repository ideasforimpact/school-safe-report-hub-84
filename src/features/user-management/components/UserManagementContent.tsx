
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserList from '@/components/users/UserList';
import { User } from '@/contexts/auth/types';

interface UserManagementContentProps {
  users: User[];
  onEditClick: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onReactivateUser: (id: string) => void;
}

const UserManagementContent = ({ 
  users,
  onEditClick,
  onDeleteUser,
  onDeactivateUser,
  onReactivateUser
}: UserManagementContentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employees</CardTitle>
        <CardDescription>
          Manage system employees and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserList 
          users={users}
          onEditClick={onEditClick}
          onDeleteUser={onDeleteUser}
          onDeactivateUser={onDeactivateUser}
          onReactivateUser={onReactivateUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserManagementContent;
