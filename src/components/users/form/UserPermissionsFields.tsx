
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
  console.log("UserPermissionsFields - Initial permissions:", permissions);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name,
        module_id: module.id
      }))
    : [];

  // Initialize selected modules based on permissions prop
  useEffect(() => {
    // Check if permissions is an array already
    if (Array.isArray(permissions)) {
      console.log("UserPermissionsFields - Setting modules from array:", permissions);
      setSelectedModules(permissions);
      return;
    }
    
    // If not an array, convert from object format
    const initialSelectedModules: ModuleAccessItem[] = Object.entries(permissions as ModulePermissions)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => {
        // Find the module name from configured modules
        const module = state.configuredModules?.find(m => m.key === key || m.id === key);
        return {
          name: module?.name || key,
          employeeId: employeeId,
          key: key,
          module_id: module?.id || key // Use module ID if found, otherwise use key as fallback
        };
      });
      
    console.log("UserPermissionsFields - Setting converted modules:", initialSelectedModules);
    setSelectedModules(initialSelectedModules);
  }, [permissions, employeeId, state.configuredModules]);

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }

  // Helper function to check if a module is selected by module_id
  const isModuleSelected = (moduleId: string): boolean => {
    return selectedModules.some(m => m.module_id === moduleId);
  };

  // Handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, moduleId: string, checked: boolean) => {
    console.log("Module change:", { moduleKey, moduleName, moduleId, checked });
    
    // Create a new array based on current selected modules
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      const moduleExists = isModuleSelected(moduleId);
      
      console.log("Module exists:", moduleExists);
      
      if (!moduleExists) {
        const newModule: ModuleAccessItem = {
          name: moduleName,
          employeeId: employeeId,
          key: moduleKey,
          module_id: moduleId
        };
        updatedModules = [...selectedModules, newModule];
      } else {
        updatedModules = [...selectedModules]; // No change needed
      }
    } else {
      // Remove module from selection
      updatedModules = selectedModules.filter(m => m.module_id !== moduleId);
    }
    
    console.log("Updated modules:", updatedModules);
    
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
          // Check if this module is selected by module_id
          const isSelected = isModuleSelected(module.module_id);
          
          console.log(`Module ${module.name} selected:`, isSelected);
          
          return (
            <div key={module.key || module.module_id} className="flex items-center space-x-2">
              <Checkbox 
                id={isEditMode ? `edit-${module.module_id}` : `module-${module.module_id}`}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleModuleChange(module.key, module.name, module.module_id, checked === true)
                }
              />
              <label 
                htmlFor={isEditMode ? `edit-${module.module_id}` : `module-${module.module_id}`}
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
