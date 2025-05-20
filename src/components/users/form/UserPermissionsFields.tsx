
import React from 'react';
import { ModulePermissions } from '@/contexts/auth/types';
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployeeStore } from '@/store/EmployeeContext';

interface UserPermissionsFieldsProps {
  permissions: ModulePermissions;
  onPermissionChange: (module: keyof ModulePermissions, value: boolean) => void;
  isEditMode?: boolean;
}

const UserPermissionsFields = ({ 
  permissions, 
  onPermissionChange,
  isEditMode = false 
}: UserPermissionsFieldsProps) => {
  const { state } = useEmployeeStore();
  
  // Debug log for configured modules
  console.log("UserPermissionsFields - Available configured modules:", state.configuredModules);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [];

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }

  return (
    <div className="space-y-2">
      <label className="font-medium">Module Permissions</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {modules.map((module) => {
          const moduleKey = module.key as keyof ModulePermissions;
          return (
            <div key={module.key} className="flex items-center space-x-2">
              <Checkbox 
                id={isEditMode ? `edit-${module.key}` : module.key}
                checked={permissions[moduleKey] || false}
                onCheckedChange={(checked) => 
                  onPermissionChange(moduleKey, checked === true)
                }
              />
              <label 
                htmlFor={isEditMode ? `edit-${module.key}` : module.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {module.name}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserPermissionsFields;
