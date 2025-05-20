
import React, { useState, useEffect } from 'react';
import { ModulePermissions } from '@/contexts/auth/types';
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface UserPermissionsFieldsProps {
  permissions: ModulePermissions | ModuleAccessItem[];
  onPermissionChange: (moduleAccessItems: ModuleAccessItem[]) => void;
  isEditMode?: boolean;
  employeeId?: string;
}

const UserPermissionsFields = ({ 
  permissions, 
  onPermissionChange,
  isEditMode = false,
  employeeId
}: UserPermissionsFieldsProps) => {
  const { state } = useEmployeeStore();
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  
  // Debug log for configured modules
  console.log("UserPermissionsFields - Available configured modules:", state.configuredModules);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [];

  // Initialize selected modules based on permissions prop
  useEffect(() => {
    // Check if permissions is an array already
    if (Array.isArray(permissions)) {
      setSelectedModules(permissions);
      return;
    }
    
    // If not an array, convert from object format
    const initialSelectedModules = Object.entries(permissions as ModulePermissions)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => {
        // Find the module name from configured modules
        const module = state.configuredModules?.find(m => m.key === key || m.id === key);
        return {
          name: module?.name || key,
          employeeId: employeeId,
          key: key
        };
      });
      
    setSelectedModules(initialSelectedModules);
  }, [permissions, employeeId, state.configuredModules]);

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }

  // Handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, checked: boolean) => {
    // Create a new array based on current selected modules
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      const moduleExists = selectedModules.some(m => 
        m.name === moduleName || m.key === moduleKey
      );
      if (!moduleExists) {
        const newModule: ModuleAccessItem = {
          name: moduleName,
          employeeId: employeeId,
          key: moduleKey
        };
        updatedModules = [...selectedModules, newModule];
      } else {
        updatedModules = [...selectedModules]; // No change needed
      }
    } else {
      // Remove module from selection
      updatedModules = selectedModules.filter(m => 
        m.name !== moduleName && m.key !== moduleKey
      );
    }
    
    // Update local state
    setSelectedModules(updatedModules);
    
    // Notify parent component of change
    onPermissionChange(updatedModules);
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Module Permissions</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {modules.map((module) => {
          // Check if this module is selected
          const isSelected = selectedModules.some(m => 
            m.name === module.name || m.key === module.key
          );
          
          return (
            <div key={module.key} className="flex items-center space-x-2">
              <Checkbox 
                id={isEditMode ? `edit-${module.key}` : module.key}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleModuleChange(module.key, module.name, checked === true)
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
