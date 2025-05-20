
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

  // Use modules from Redux if available, otherwise use default modules
  const modules = state.configuredModules && state.configuredModules.length > 0
    ? state.configuredModules.map(module => ({
        key: module.key || module.id,
        name: module.name
      }))
    : [
        { key: 'superAdmin', name: 'Super Admin' },
        { key: 'incidentReporting', name: 'Incident Reporting' },
        { key: 'incidentAdmin', name: 'Incident Admin' },
        { key: 'assessmentUser', name: 'Assessment User' },
        { key: 'assessmentsAdmin', name: 'Assessments Admin' },
        { key: 'employeeVerificationAdmin', name: 'Employee Verification Admin' },
        { key: 'grievancesAdmin', name: 'Grievances Admin' },
        { key: 'transportSafetyAdmin', name: 'Transport Safety Admin' },
        { key: 'eduSafeResourceAccess', name: 'EduSafe Resource Access' }
      ];

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
                    onCheckedChange={(checked) => onModulePermissionChange(moduleKey, checked === true)}
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
