
import React from 'react';
import { UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UserForm from './UserForm';

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>>;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading?: boolean;
}

const AddUserDialog = ({ 
  isOpen, 
  setIsOpen, 
  formData, 
  setFormData, 
  onSubmit,
  resetForm,
  isLoading = false
}: AddUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the system
          </DialogDescription>
        </DialogHeader>
        <UserForm formData={formData} setFormData={setFormData} />
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsOpen(false);
            resetForm();
          }} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
