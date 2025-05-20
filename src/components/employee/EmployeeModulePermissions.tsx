
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePermissions } from '@/contexts/auth/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from '@/store/EmployeeContext';

interface EmployeeModulePermissionsProps {
  modulePermissions: ModulePermissions;
  onModulePermissionChange: (key: keyof ModulePermissions, value: boolean) => void;
}

const EmployeeModulePermissions: React.FC<EmployeeModulePermissionsProps> = ({
  modulePermissions,
  onModulePermissionChange
}) => {
  const { state } = useEmployeeStore();
  
  // Debug log for configured modules
  console.log("EmployeeModulePermissions - Available configured modules:", state.configuredModules);
  
  // Use modules from Redux if available
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [];

  if (modules.length === 0) {
    console.warn("No modules found in Redux store. Module permissions may not be displayed correctly.");
  }
  
  // Handler for checkbox change that only affects one module at a time
  const handleModuleChange = (key: keyof ModulePermissions, checked: boolean) => {
    // Only update the specific module that was clicked
    onModulePermissionChange(key, checked);
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
            const moduleKey = module.key as keyof ModulePermissions;
            const isEnabled = modulePermissions[moduleKey] || false;
            
            return (
              <TableRow key={module.key}>
                <TableCell>
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleModuleChange(moduleKey, checked === true)}
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
