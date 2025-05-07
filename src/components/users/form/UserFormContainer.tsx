
import React from 'react';
import { UserRole, ModulePermissions } from '@/contexts/AuthContext';
import UserBasicInfoFields from './UserBasicInfoFields';
import UserRoleSelector from './UserRoleSelector';
import UserPermissionsFields from './UserPermissionsFields';

interface UserFormContainerProps {
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
      <UserRoleSelector
        role={formData.role}
        onRoleChange={(role) => setFormData({...formData, role})}
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
