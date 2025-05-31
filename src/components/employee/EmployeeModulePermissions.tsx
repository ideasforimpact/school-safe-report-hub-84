
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePermissions } from '@/contexts/auth/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface EmployeeModulePermissionsProps {
  modulePermissions: ModulePermissions | ModuleAccessItem[];
  onModulePermissionChange: (selectedModules: ModuleAccessItem[]) => void;
  employeeId?: string;
}

const EmployeeModulePermissions: React.FC<EmployeeModulePermissionsProps> = ({
  modulePermissions,
  onModulePermissionChange,
  employeeId
}) => {
  const { state } = useEmployeeStore();
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  
  // Debug log for configured modules
  //console.log("EmployeeModulePermissions - Available configured modules:", state.configuredModules);
  //console.log("EmployeeModulePermissions - Initial module permissions:", modulePermissions);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name,
        module_id: module.id
      }))
    : [];

  // Initialize selected modules based on modulePermissions prop
  useEffect(() => {
    // Check if modulePermissions is an array already
    if (Array.isArray(modulePermissions)) {
      //console.log("EmployeeModulePermissions - Setting modules from array:", modulePermissions);
      setSelectedModules(modulePermissions);
      return;
    }
    
    // If not an array, convert from object format
    const initialSelectedModules: ModuleAccessItem[] = Object.entries(modulePermissions as ModulePermissions)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => {
        // Find the module name from configured modules
        const module = state.configuredModules?.find(m => m.key === key || m.id === key);
        return {
          name: module?.name || key,
          employeeId: employeeId,
          key: key,
          module_id: module?.id || key // Use module ID if found, otherwise use key
        };
      });
      
    //console.log("EmployeeModulePermissions - Setting converted modules:", initialSelectedModules);
    setSelectedModules(initialSelectedModules);
  }, [modulePermissions, employeeId, state.configuredModules]);

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }
  
  // Helper function to check if a module is selected by module_id
  const isModuleSelected = (moduleId: string): boolean => {
    return selectedModules.some(m => m.module_id === moduleId);
  };
  
  // Handler for checkbox change that only affects one module at a time
  const handleModuleChange = (moduleKey: string, moduleName: string, moduleId: string, checked: boolean) => {
    //console.log("Module change:", { moduleKey, moduleName, moduleId, checked });
    
    // Create a new array based on current selected modules
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      const moduleExists = isModuleSelected(moduleId);
      
      //console.log("Module exists:", moduleExists);
      
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
    
    //console.log("Updated modules:", updatedModules);
    
    // Update local state
    setSelectedModules(updatedModules);
    
    // Notify parent component of change
    onModulePermissionChange(updatedModules);
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Enabled</TableHead>
            <TableHead>Module Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => {
            // Check if this module is selected by its module_id
            const isSelected = isModuleSelected(module.module_id);
            
            //console.log(`Module ${module.name} selected:`, isSelected);
            
            return (
              <TableRow key={module.key || module.module_id}>
                <TableCell>
                  <Checkbox
                    id={`emp-module-${module.module_id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleModuleChange(
                      module.key, 
                      module.name, 
                      module.module_id,
                      checked === true
                    )}
                  />
                </TableCell>
                <TableCell>
                  <label 
                    htmlFor={`emp-module-${module.module_id}`} 
                    className="cursor-pointer"
                  >
                    {module.name}
                  </label>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeModulePermissions;
