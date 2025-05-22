
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { Badge } from "@/components/ui/badge";
import { Check } from 'lucide-react';
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

  // Helper function to check if a module has admin access
  const isModuleAdmin = (moduleId: string): boolean => {
    const module = selectedModules.find(m => m.module_id === moduleId);
    return module?.access_level?.is_admin === true;
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
          module_id: moduleId,
          access_level: { is_admin: false }  // Default to not admin
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

  // Handler for admin badge click
  const handleAdminBadgeClick = (moduleId: string) => {
    const moduleToUpdate = selectedModules.find(m => m.module_id === moduleId);
    if (!moduleToUpdate) return;
    
    console.log(`Admin badge click - Module ID: ${moduleId}, Current admin: ${moduleToUpdate.access_level?.is_admin}`);
    
    // Toggle the admin access state for this module
    const updatedModules = selectedModules.map(m => {
      if (m.module_id === moduleId) {
        return { 
          ...m, 
          access_level: { 
            ...m.access_level,
            is_admin: !m.access_level?.is_admin 
          }
        };
      }
      return m;
    });
    
    console.log("After admin toggle, modules:", updatedModules);
    
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
            
            console.log(`Module ${module.name} selected: ${isSelected}, admin: ${isAdmin}`);
            
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
                    <Badge
                      variant={isAdmin ? "default" : "outline"}
                      className={cn(
                        "relative pr-7 transition-all duration-200 cursor-pointer",
                        isAdmin 
                          ? "bg-green-500 text-white hover:bg-green-600" 
                          : "text-muted-foreground hover:bg-gray-100"
                      )}
                      onClick={() => handleAdminBadgeClick(module.module_id)}
                    >
                      Admin
                      {isAdmin && (
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </Badge>
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
