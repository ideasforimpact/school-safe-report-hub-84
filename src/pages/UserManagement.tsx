
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth, User, UserRole, ModulePermissions } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import UserList from '@/components/users/UserList';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    role: 'reporter' as UserRole,
    modulePermissions: {
      incidentReporting: true,
      allIncidents: true,
      insights: true,
      benchmarking: false
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      designation: '',
      role: 'reporter',
      modulePermissions: {
        incidentReporting: true,
        allIncidents: true,
        insights: true,
        benchmarking: false
      }
    });
    setCurrentUser(null);
  };

  const handleAddUser = () => {
    addUser(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      designation: user.designation || '',
      role: user.role,
      modulePermissions: {
        incidentReporting: user.modulePermissions?.incidentReporting ?? true,
        allIncidents: user.modulePermissions?.allIncidents ?? true,
        insights: user.modulePermissions?.insights ?? true,
        benchmarking: user.modulePermissions?.benchmarking ?? false
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        role: formData.role,
        modulePermissions: formData.modulePermissions,
        ...(formData.password ? { password: formData.password } : {})
      });
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserList 
              users={users}
              onEditClick={handleEditClick}
              onDeleteUser={handleDeleteUser}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddUser}
        resetForm={resetForm}
      />

      {/* Edit User Dialog */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateUser}
        resetForm={resetForm}
      />
    </Layout>
  );
};

export default UserManagement;
