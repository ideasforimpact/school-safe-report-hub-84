
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { supabase } from '@/integrations/supabase/client';

interface ModuleAccessProps {
  selectedModules: ModuleAccessItem[];
  onModuleChange: (modules: ModuleAccessItem[]) => void;
  employeeId?: string;
}

const ModuleAccess: React.FC<ModuleAccessProps> = ({ selectedModules, onModuleChange, employeeId }) => {
  const { state } = useEmployeeStore();
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  // Log for debugging
  console.log("ModuleAccess - Selected Modules:", selectedModules);
  console.log("ModuleAccess - Employee ID:", employeeId);
  console.log("ModuleAccess - Configured modules from store:", state.configuredModules);

  // Fetch available modules on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        // First try to get modules from the Redux store
        if (state.configuredModules && state.configuredModules.length > 0) {
          console.log("Using modules from Redux store");
          setAvailableModules(state.configuredModules);
        } else {
          // If not available in Redux, fetch from database
          console.log("Fetching modules from database");
          const { data: modules, error } = await supabase
            .from('modules')
            .select('*')
            .order('name');

          if (error) {
            console.error("Error fetching modules:", error);
            return;
          }

          if (modules) {
            console.log("Modules fetched from database:", modules);
            setAvailableModules(modules);
          }
        }
      } catch (error) {
        console.error("Error in fetchModules:", error);
      }
    };

    fetchModules();
  }, [state.configuredModules]);

  const handleModuleChange = (isChecked: boolean, moduleKey: string, moduleName: string, moduleId: string) => {
    console.log(`Module ${moduleName} (${moduleKey}) changed:`, isChecked);

    let updatedModules = [...selectedModules];

    if (isChecked) {
      // Check if the module is already in the list by checking both name and key
      const existingIndex = updatedModules.findIndex(
        m => (m.name === moduleName || m.key === moduleKey)
      );

      if (existingIndex === -1) {
        // If not in the list, add it
        const newModule: ModuleAccessItem = {
          name: moduleName,
          key: moduleKey,
          module_id: moduleId, // Include the module_id
          employeeId: employeeId
        };
        console.log("Adding module:", newModule);
        updatedModules.push(newModule);
      }
    } else {
      // Remove the module from the list
      updatedModules = updatedModules.filter(m => 
        !(m.name === moduleName || m.key === moduleKey)
      );
      console.log("Removed module:", moduleName);
    }

    console.log("Updated modules:", updatedModules);
    onModuleChange(updatedModules);
  };

  const isModuleSelected = (moduleName: string, moduleKey: string): boolean => {
    return selectedModules.some(m => 
      m.name === moduleName || m.key === moduleKey
    );
  };

  return (
    <div className="space-y-4 border rounded-md p-4">
      <Label className="text-base">Module Access</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {availableModules.map((module) => {
          const isSelected = isModuleSelected(module.name, module.level);
          
          return (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`module-${module.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleModuleChange(
                    checked === true, 
                    module.level,
                    module.name,
                    module.id
                  )
                }
              />
              <Label htmlFor={`module-${module.id}`}>{module.name}</Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleAccess;
