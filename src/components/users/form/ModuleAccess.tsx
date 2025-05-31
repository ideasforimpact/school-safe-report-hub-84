
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { Badge } from "@/components/ui/badge";
import { Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Helper function to check if a module has admin access
  const isModuleAdmin = (moduleId: string): boolean => {
    const module = selectedModules.find(m => m.module_id === moduleId);
    return module?.level?.is_admin === true;
  };

  // Handler for checkbox change
  const handleModuleChange = (moduleKey: string, moduleName: string, moduleId: string, checked: boolean) => {
    let updatedModules: ModuleAccessItem[];
    
    if (checked) {
      // Add module to selection if it's not already there
      if (!isModuleSelected(moduleId)) {
        const newModule: ModuleAccessItem = {
          name: moduleName,
          employeeId: employeeId,
          key: moduleKey,
          module_id: moduleId,
          level: { is_admin: false }  // Default to not admin
        };
        updatedModules = [...selectedModules, newModule];
      } else {
        updatedModules = [...selectedModules]; // No change needed
      }
    } else {
      // Remove module from selection
      updatedModules = selectedModules.filter(m => m.module_id !== moduleId);
    }
    
    // Notify parent component of change
    onModuleChange(updatedModules);
  };

  // Handler for admin toggle
  const handleAdminToggle = (moduleId: string) => {
    const moduleToUpdate = selectedModules.find(m => m.module_id === moduleId);
    if (!moduleToUpdate) return;
    
    // Toggle the admin access state for this module
    const updatedModules = selectedModules.map(m => {
      if (m.module_id === moduleId) {
        return { 
          ...m, 
          level: { 
            ...m.level,
            is_admin: !m.level?.is_admin 
          }
        };
      }
      return m;
    });
    
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
            <TableHead className="w-[120px]">Access Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableModules.map((module) => {
            const isSelected = isModuleSelected(module.module_id);
            const isAdmin = isModuleAdmin(module.module_id);
            
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
                <TableCell>
                  {isSelected && (
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleAdminToggle(module.module_id)}
                    >
                      {isAdmin ? (
                        <ToggleRight className="text-green-500 h-6 w-6 mr-2" />
                      ) : (
                        <ToggleLeft className="text-gray-400 h-6 w-6 mr-2" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        isAdmin ? "text-green-600" : "text-gray-500"
                      )}>
                        Admin
                      </span>
                    </div>
                  )}
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
