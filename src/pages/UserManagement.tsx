
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserSearch, FileUp } from 'lucide-react';
import UserList from '@/components/users/UserList';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import ImportEmployeeDialog from '@/components/employee/ImportEmployeeDialog';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { User } from '@/types/user';

export interface EmployeeUser extends User {
  createdAt: string;
  role: 'admin' | 'user' | 'moderator';
}

interface UserManagementProps {
  embedded?: boolean;
}

const UserManagement = ({ embedded = false }: UserManagementProps) => {
  const { users, updateUser, deleteUser, deactivateUser, reactivateUser, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmployeeUser | null>(null);

  const handleEditClick = (user: EmployeeUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeactivateUser = async (id: string) => {
    try {
      await deactivateUser(id);
      toast.success('User deactivated successfully');
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleReactivateUser = async (id: string) => {
    try {
      await reactivateUser(id);
      toast.success('User reactivated successfully');
    } catch (error) {
      toast.error('Failed to reactivate user');
    }
  };

  // Convert User[] to EmployeeUser[] by ensuring required properties exist
  const employeeUsers: EmployeeUser[] = users.map(user => ({
    ...user,
    createdAt: user.createdAt || new Date().toISOString(),
    role: user.role || 'user' as const
  }));

  const filteredUsers = employeeUsers.filter(
    user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their permissions in your institution
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Users</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex justify-end gap-2">
          <Button 
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2"
            variant="secondary"
          >
            <FileUp className="h-4 w-4" />
            <span>Import Users</span>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <UserSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        /* Users list */
        <UserList
          users={filteredUsers}
          onEditClick={handleEditClick}
          onDeleteUser={handleDeleteUser}
          onDeactivateUser={handleDeactivateUser}
          onReactivateUser={handleReactivateUser}
        />
      )}

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={selectedUser}
        />
      )}

      {/* Import Users Dialog */}
      <ImportEmployeeDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
};

export default UserManagement;
