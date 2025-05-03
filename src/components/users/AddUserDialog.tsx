
import React from 'react';
import { UserRole, ModulePermissions } from '@/contexts/AuthContext';
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
    name: string;
    email: string;
    password: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>>;
  onSubmit: () => void;
  resetForm: () => void;
}

const AddUserDialog = ({ 
  isOpen, 
  setIsOpen, 
  formData, 
  setFormData, 
  onSubmit,
  resetForm 
}: AddUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        <UserForm formData={formData} setFormData={setFormData} />
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Add User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
