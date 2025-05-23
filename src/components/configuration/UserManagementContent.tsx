
import React, { useState } from 'react';
import UserList from '@/components/users/UserList';
import { useAuth } from '@/contexts/auth';
import { User } from '@/contexts/auth/types';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

const UserManagementContent = () => {
  // State for users management
  const { users, addUser, updateUser, deleteUser, deactivateUser, reactivateUser } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    employeeType: '' as any,
    department: '' as any,
    joiningDate: '',
    moduleAccessPayload: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle opening the edit user dialog
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId || '',
      employeeType: user.employeeType || '',
      department: user.department || '',
      joiningDate: user.joiningDate || '',
      moduleAccessPayload: [],
    });
    setIsEditDialogOpen(true);
  };

  // Handle user deletion
  const handleDeleteUser = (id: string) => {
    deleteUser(id);
    toast.success('User deleted successfully');
  };

  // Handle user deactivation
  const handleDeactivateUser = (id: string) => {
    deactivateUser(id);
    toast.success('User deactivated successfully');
  };

  // Handle dialog submission
  const handleAddSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      addUser(formData);
      setIsSubmitting(false);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('User added successfully');
    }, 1000);
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      updateUser(selectedUser.id, formData);
      setIsSubmitting(false);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success('User updated successfully');
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      employeeType: '' as any,
      department: '' as any,
      joiningDate: '',
      moduleAccessPayload: [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <UserList 
        users={users} 
        onEditClick={handleEditClick} 
        onDeleteUser={handleDeleteUser} 
        onDeactivateUser={handleDeactivateUser} 
      />

      <AddUserDialog
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddSubmit}
        resetForm={resetForm}
        isLoading={isSubmitting}
      />

      <EditUserDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditSubmit}
        resetForm={resetForm}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default UserManagementContent;
