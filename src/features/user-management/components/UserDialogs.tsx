
import React from 'react';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import { User, UserRole, EmployeeType, DepartmentType, ModulePermissions } from '@/contexts/auth/types';

interface UserDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    employeeType: EmployeeType;
    department: DepartmentType;
    joiningDate: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    employeeType: EmployeeType;
    department: DepartmentType;
    joiningDate: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>>;
  onAddSubmit: () => void;
  onEditSubmit: () => void;
  resetForm: () => void;
}

const UserDialogs = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  formData,
  setFormData,
  onAddSubmit,
  onEditSubmit,
  resetForm
}: UserDialogsProps) => {
  return (
    <>
      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onAddSubmit}
        resetForm={resetForm}
      />

      {/* Edit User Dialog */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onEditSubmit}
        resetForm={resetForm}
      />
    </>
  );
};

export default UserDialogs;
