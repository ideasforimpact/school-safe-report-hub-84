
import React, { useState, useEffect,useRef } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { Badge } from "@/components/ui/badge";
import { Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import defaultModules from '@/utils/default-modules.json';

interface ModuleAccessProps {
  selectedModules: ModuleAccessItem[];
  onModuleChange: (moduleAccessItems: ModuleAccessItem[]) => void;
  employeeId?: string;
  isSuperAdmin?: boolean;
}

const ModuleAccess: React.FC<ModuleAccessProps> = ({
  selectedModules,
  onModuleChange,
  employeeId,
  isSuperAdmin = false
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
    const hasAppliedDefaultsRef = useRef(false);
  
    useEffect(() => {
      if (isSuperAdmin) return;
      if (hasAppliedDefaultsRef.current) return;

      const normalize = (s?: string) => String(s || '').trim().toLowerCase();

      // Build indexed lookup for configured modules
      const configuredMap: Record<string, any> = {};
      (state.configuredModules || []).forEach((m: any) => {
        configuredMap[normalize(m.module_id)] = m;
        configuredMap[normalize(m.key)] = m;
        configuredMap[normalize(m.name)] = m;
      });

      // Take only enabled defaults
      const enabledDefaults = (defaultModules || []).filter((d: any) => d.enabled);

      // Map each default to configured module → produce correct ModuleAccessItem
      const mappedDefaults: ModuleAccessItem[] = enabledDefaults.map((d: any) => {
        const match =
          configuredMap[normalize(d.module_id)] ||
          configuredMap[normalize(d.key)] ||
          configuredMap[normalize(d.name)];

        if (match) {
          return {
            key: match.key || d.key,
            module_id: match.module_id,
            name: match.name,
            employeeId: employeeId,
            level: { is_admin: !!d.defaultAdmin }
          };
        }

        return {
          key: d.key,
          module_id: d.module_id,
          name: d.name,
          employeeId: employeeId,
          level: { is_admin: !!d.defaultAdmin }
        };
      });

      const toAdd = mappedDefaults.filter(md => {
        return !selectedModules.some(s =>
          normalize(s.module_id) === normalize(md.module_id)
        );
      });

      if (toAdd.length > 0) {
        onModuleChange([...selectedModules, ...toAdd]);
      }

      hasAppliedDefaultsRef.current = true;
    }, [state.configuredModules, employeeId, isSuperAdmin]);

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
      {isSuperAdmin && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Super Admin Access:</strong> This user has full access to all modules. Module access controls are disabled.
          </p>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Enabled</TableHead>
            <TableHead>Module Name</TableHead>
            <TableHead className="w-[120px]">Access Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableModules.map((module, index) => {
            const isSelected = isModuleSelected(module.module_id);
            const isAdmin = isModuleAdmin(module.module_id);
            
            return (
              <TableRow key={`${module.module_id}-${index}`}>
                <TableCell>
                  <Checkbox
                    id={`module-checkbox-${module.module_id}`}
                    checked={isSelected}
                    disabled={isSuperAdmin}
                    onCheckedChange={(checked) => handleModuleChange(
                      module.key, 
                      module.name, 
                      module.module_id,
                      checked === true
                    )}
                    className={cn(
                      isSuperAdmin && "opacity-50 cursor-not-allowed"
                    )}
                  />
                </TableCell>
                <TableCell>
                  <label 
                    htmlFor={`module-checkbox-${module.module_id}`}
                    className={cn(
                      "cursor-pointer",
                      isSuperAdmin && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {module.name}
                  </label>
                </TableCell>
                <TableCell>
                  {isSelected && (
                    <div 
                      className={cn(
                        "flex items-center",
                        isSuperAdmin ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      )}
                      onClick={isSuperAdmin ? undefined : () => handleAdminToggle(module.module_id)}
                    >
                      {isAdmin ? (
                        <ToggleRight className="text-green-500 h-6 w-6 mr-2" />
                      ) : (
                        <ToggleLeft className="text-gray-400 h-6 w-6 mr-2" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        isAdmin ? "text-green-600" : "text-gray-500",
                        isSuperAdmin && "opacity-50"
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
