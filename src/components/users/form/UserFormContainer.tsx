
import React from 'react';
import { UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import UserBasicInfoFields from './UserBasicInfoFields';
import UserPermissionsFields from './UserPermissionsFields';

interface UserFormContainerProps {
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

const UserFormContainer = ({ formData, setFormData, isEditMode = false }: UserFormContainerProps) => {
  const handleModulePermissionChange = (module: keyof ModulePermissions, value: boolean) => {
    setFormData({
      ...formData,
      modulePermissions: {
        ...formData.modulePermissions,
        [module]: value
      }
    });
  };

  return (
    <div className="space-y-4 py-4">
      <UserBasicInfoFields 
        formData={formData}
        setFormData={setFormData}
        isEditMode={isEditMode}
      />
      <UserPermissionsFields
        permissions={formData.modulePermissions}
        onPermissionChange={handleModulePermissionChange}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default UserFormContainer;
