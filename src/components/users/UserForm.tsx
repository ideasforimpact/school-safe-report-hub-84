
import React from 'react';
import { UserRole, ModulePermissions } from '@/contexts/AuthContext';
import UserFormContainer from './form/UserFormContainer';

interface UserFormProps {
  formData: {
    name: string;
    email: string;
    password: string;
    designation?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    designation?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>>;
  isEditMode?: boolean;
}

const UserForm = ({ formData, setFormData, isEditMode = false }: UserFormProps) => {
  return <UserFormContainer formData={formData} setFormData={setFormData} isEditMode={isEditMode} />;
};

export default UserForm;
