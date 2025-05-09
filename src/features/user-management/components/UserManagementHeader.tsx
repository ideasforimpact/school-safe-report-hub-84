
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface UserManagementHeaderProps {
  onAddUser: () => void;
}

const UserManagementHeader = ({ onAddUser }: UserManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Employee Management</h1>
      <Button onClick={onAddUser}>
        <UserPlus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>
    </div>
  );
};

export default UserManagementHeader;
