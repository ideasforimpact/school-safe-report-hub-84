
import React from 'react';
import { UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import UserBasicInfoFields from './UserBasicInfoFields';
import UserPermissionsFields from './UserPermissionsFields';
import { ModuleAccessItem } from '@/types/moduleAccess';

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
  // Updated to accept an array of ModuleAccessItem objects
  const handleModulePermissionChange = (moduleAccessItems: ModuleAccessItem[]) => {
    // Convert the array of ModuleAccessItem objects to the modulePermissions object format
    const updatedPermissions = { ...formData.modulePermissions };
    
    // First, reset all permissions to false
    Object.keys(updatedPermissions).forEach(key => {
      (updatedPermissions as any)[key] = false;
    });
    
    // Then, set the selected permissions to true
    moduleAccessItems.forEach(item => {
      if (item.key && Object.keys(updatedPermissions).includes(item.key)) {
        (updatedPermissions as any)[item.key] = true;
      }
    });
    
    setFormData({
      ...formData,
      modulePermissions: updatedPermissions
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
