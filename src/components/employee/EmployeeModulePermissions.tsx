
import React from 'react';
import { ModulePermissions } from '@/contexts/auth/types';
import { Checkbox } from "@/components/ui/checkbox";

interface EmployeeModulePermissionsProps {
  modulePermissions: ModulePermissions;
  onModulePermissionChange: (key: keyof ModulePermissions, value: boolean) => void;
  disabled?: boolean;
}

const EmployeeModulePermissions: React.FC<EmployeeModulePermissionsProps> = ({
  modulePermissions,
  onModulePermissionChange,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="superAdmin"
          checked={modulePermissions.superAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('superAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="superAdmin" className="text-sm">
          Super Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="incidentReporting"
          checked={modulePermissions.incidentReporting}
          onCheckedChange={(checked) => onModulePermissionChange('incidentReporting', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="incidentReporting" className="text-sm">
          Incident Reporting
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="incidentAdmin"
          checked={modulePermissions.incidentAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('incidentAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="incidentAdmin" className="text-sm">
          Incident Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="assessmentUser"
          checked={modulePermissions.assessmentUser}
          onCheckedChange={(checked) => onModulePermissionChange('assessmentUser', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="assessmentUser" className="text-sm">
          Assessment User
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="assessmentsAdmin"
          checked={modulePermissions.assessmentsAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('assessmentsAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="assessmentsAdmin" className="text-sm">
          Assessments Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="employeeVerificationAdmin"
          checked={modulePermissions.employeeVerificationAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('employeeVerificationAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="employeeVerificationAdmin" className="text-sm">
          Employee Verification Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="grievancesAdmin"
          checked={modulePermissions.grievancesAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('grievancesAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="grievancesAdmin" className="text-sm">
          Grievances Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="transportSafetyAdmin"
          checked={modulePermissions.transportSafetyAdmin}
          onCheckedChange={(checked) => onModulePermissionChange('transportSafetyAdmin', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="transportSafetyAdmin" className="text-sm">
          Transport Safety Admin
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="eduSafeResourceAccess"
          checked={modulePermissions.eduSafeResourceAccess}
          onCheckedChange={(checked) => onModulePermissionChange('eduSafeResourceAccess', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="eduSafeResourceAccess" className="text-sm">
          EduSafe Resource Access
        </label>
      </div>
    </div>
  );
};

export default EmployeeModulePermissions;
