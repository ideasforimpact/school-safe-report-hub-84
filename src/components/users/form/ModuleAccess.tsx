
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
        name: module.name,
        module_id: module.id // Include the module ID from store
      }))
    : [];

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Modules may not be displayed correctly.");
  }
  
  // Fixed handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, moduleId: string, checked: boolean) => {
    console.log(`Module ${moduleName} (${moduleKey}) change:`, { checked });
    
    // Create a deep copy of current selected modules
    let updatedModules = [...selectedModules];
    
    if (checked) {
      // Add the module only if it doesn't already exist with EXACTLY the same key and name
      const exists = updatedModules.some(m => m.key === moduleKey && m.name === moduleName);
      
      if (!exists) {
        // Add new module to the selection
        updatedModules.push({
          name: moduleName,
          employeeId: employeeId,
          key: moduleKey,
          module_id: moduleId // Always include module_id
        });
        
        console.log(`Added module ${moduleName} (${moduleKey}) to selection`);
      }
    } else {
      // Remove the exact module that matches both key and name
      updatedModules = updatedModules.filter(m => !(m.key === moduleKey && m.name === moduleName));
      console.log(`Removed module ${moduleName} (${moduleKey}) from selection`);
    }
    
    console.log("Updated modules:", updatedModules);
    // Only call onModuleChange when we actually make a change to the modules
    onModuleChange(updatedModules);
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Module Access</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {modules.map((module) => {
          // Strict check - module must match BOTH key AND name exactly
          const isSelected = selectedModules.some(m => 
            m.key === module.key && m.name === module.name
          );
          
          console.log(`Module ${module.name} (${module.key}) selected:`, isSelected);
          
          return (
            <div key={module.key} className="flex items-center space-x-2">
              <Checkbox 
                id={`module-${module.key}`}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleModuleChange(module.key, module.name, module.module_id || '', checked === true)
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
