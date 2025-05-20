
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface ModuleAccessProps {
  selectedModules: ModuleAccessItem[];
  onModuleChange: (selectedModules: ModuleAccessItem[]) => void;
  employeeId?: string;
}

const ModuleAccess = ({ 
  selectedModules, 
  onModuleChange,
  employeeId
}: ModuleAccessProps) => {
  const { state } = useEmployeeStore();
  
  // Debug log for configured modules
  console.log("ModuleAccess - Available configured modules:", state.configuredModules);
  console.log("ModuleAccess - Initial selected modules:", selectedModules);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [];

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Modules may not be displayed correctly.");
  }
  
  // Completely rewritten handler for checkbox change to fix selection issues
  const handleModuleChange = (moduleKey: string, moduleName: string, checked: boolean) => {
    console.log(`Module ${moduleName} (${moduleKey}) change:`, { checked });
    
    if (checked) {
      // Create new module object
      const newModule: ModuleAccessItem = {
        name: moduleName,
        employeeId: employeeId,
        key: moduleKey
      };
      
      // Check if this exact module doesn't already exist in the selection
      const exists = selectedModules.some(m => 
        (m.key === moduleKey && m.name === moduleName)
      );
      
      if (!exists) {
        // Add only this module to the selection
        const updatedModules = [...selectedModules, newModule];
        console.log(`Adding ${moduleName} to selection:`, updatedModules);
        onModuleChange(updatedModules);
      }
    } else {
      // Remove only this specific module from selection
      const updatedModules = selectedModules.filter(m => 
        !(m.key === moduleKey && m.name === moduleName)
      );
      console.log(`Removing ${moduleName} from selection:`, updatedModules);
      onModuleChange(updatedModules);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Module Access</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {modules.map((module) => {
          // More strict check - module must match BOTH key AND name exactly
          const isSelected = selectedModules.some(m => 
            m.key === module.key && m.name === module.name
          );
          
          console.log(`Module ${module.name} selected:`, isSelected);
          
          return (
            <div key={module.key} className="flex items-center space-x-2">
              <Checkbox 
                id={`module-${module.key}`}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleModuleChange(module.key, module.name, checked === true)
                }
              />
              <label 
                htmlFor={`module-${module.key}`}
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

export default ModuleAccess;
