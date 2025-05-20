
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePermissions } from '@/contexts/auth/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';

interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key?: string;
}

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
  console.log("EmployeeModulePermissions - Available configured modules:", state.configuredModules);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [];

  // Initialize selected modules based on modulePermissions prop
  useEffect(() => {
    // Check if modulePermissions is an array already
    if (Array.isArray(modulePermissions)) {
      setSelectedModules(modulePermissions);
      return;
    }
    
    // If not an array, convert from object format
    const initialSelectedModules = Object.entries(modulePermissions as ModulePermissions)
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
  }, [modulePermissions, employeeId, state.configuredModules]);

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }
  
  // Handler for checkbox change that only affects one module at a time
  const handleModuleChange = (moduleKey: string, moduleName: string, checked: boolean) => {
    // Create a new array based on current selected modules
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      const moduleExists = selectedModules.some(m => m.name === moduleName || m.key === moduleKey);
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
            // Check if this module is selected
            const isSelected = selectedModules.some(m => 
              m.name === module.name || m.key === module.key
            );
            
            return (
              <TableRow key={module.key}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleModuleChange(
                      module.key, 
                      module.name, 
                      checked === true
                    )}
                  />
                </TableCell>
                <TableCell>{module.name}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeModulePermissions;
