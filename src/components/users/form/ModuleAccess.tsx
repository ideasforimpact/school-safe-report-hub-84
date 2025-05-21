
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface ModuleAccessProps {
  selectedModules: ModuleAccessItem[];
  onModuleChange: (moduleAccessItems: ModuleAccessItem[]) => void;
  employeeId?: string;
}

const ModuleAccess: React.FC<ModuleAccessProps> = ({
  selectedModules,
  onModuleChange,
  employeeId
}) => {
  const { state } = useEmployeeStore();
  
  // Debug log for configured modules and selected modules
  console.log("ModuleAccess - Available configured modules:", state.configuredModules);
  console.log("ModuleAccess - Selected modules:", selectedModules);
  
  // Create a mapping from modules in Redux
  const availableModules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name,
        module_id: module.id
      }))
    : [];

  // Helper function to check if a module is selected
  const isModuleSelected = (moduleId: string): boolean => {
    return selectedModules.some(m => m.module_id === moduleId);
  };

  // Handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, moduleId: string, checked: boolean) => {
    console.log("Module change:", { moduleKey, moduleName, moduleId, checked });
    
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      if (!isModuleSelected(moduleId)) {
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
    
    // Notify parent component of change
    onModuleChange(updatedModules);
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
          {availableModules.map((module) => {
            const isSelected = isModuleSelected(module.module_id);
            
            console.log(`Module ${module.name} selected:`, isSelected);
            
            return (
              <TableRow key={module.key || module.module_id}>
                <TableCell>
                  <Checkbox
                    id={`module-checkbox-${module.module_id}`}
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
                    htmlFor={`module-checkbox-${module.module_id}`}
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

export default ModuleAccess;
