
import React from 'react';
import { UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import UserFormContainer from './form/UserFormContainer';

interface UserFormProps {
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
  isEditMode?: boolean;
}

const UserForm = ({ formData, setFormData, isEditMode = false }: UserFormProps) => {
  return <UserFormContainer formData={formData} setFormData={setFormData} isEditMode={isEditMode} />;
};

export default UserForm;
