
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
  
  // Handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, checked: boolean) => {
    console.log("Module change:", { moduleKey, moduleName, checked });
    
    // Create a new array based on current selected modules
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      const moduleExists = selectedModules.some(m => 
        (m.key === moduleKey) || (m.name === moduleName)
      );
      
      console.log("Module exists:", moduleExists);
      
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
        !(m.key === moduleKey || m.name === moduleName)
      );
    }
    
    console.log("Updated modules:", updatedModules);
    
    // Notify parent component of change
    onModuleChange(updatedModules);
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Module Access</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {modules.map((module) => {
          // Check if this module is selected - use both key and name for comparison
          const isSelected = selectedModules.some(m => 
            (m.key === module.key) || (m.name === module.name)
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
