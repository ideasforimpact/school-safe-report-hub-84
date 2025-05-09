import React from 'react';
import { ModulePermissions } from '@/contexts/auth/types';
import { Checkbox } from "@/components/ui/checkbox";

interface EmployeeModulePermissionsProps {
  permissions?: ModulePermissions;
  onPermissionChange: (module: string, value: boolean) => void;
  isEditMode?: boolean;
}

const EmployeeModulePermissions = ({ 
  permissions = {
    superAdmin: false,
    incidentReporting: false,
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: false
  }, 
  onPermissionChange,
  isEditMode = false 
}: EmployeeModulePermissionsProps) => {
  return (
    <div className="space-y-2">
      <label className="font-medium">Module Permissions</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        {/* Security permissions */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-super-admin" : "super-admin"}
            checked={permissions.superAdmin}
            onCheckedChange={(checked) => 
              onPermissionChange('superAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-super-admin" : "super-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Super Admin
          </label>
        </div>

        {/* Incident Management */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-incident-reporting" : "incident-reporting"}
            checked={permissions.incidentReporting || false}
            onCheckedChange={(checked) => 
              onPermissionChange('incidentReporting', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-incident-reporting" : "incident-reporting"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Incident Reporting
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-incident-admin" : "incident-admin"}
            checked={permissions.incidentAdmin || false}
            onCheckedChange={(checked) => 
              onPermissionChange('incidentAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-incident-admin" : "incident-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Incident Admin
          </label>
        </div>

        {/* Assessment modules */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-assessment-user" : "assessment-user"}
            checked={permissions.assessmentUser || false}
            onCheckedChange={(checked) => 
              onPermissionChange('assessmentUser', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-assessment-user" : "assessment-user"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Assessment User
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-assessments-admin" : "assessments-admin"}
            checked={permissions.assessmentsAdmin || false}
            onCheckedChange={(checked) => 
              onPermissionChange('assessmentsAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-assessments-admin" : "assessments-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Assessments Admin
          </label>
        </div>

        {/* Verification and safety modules */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-employee-verification-admin" : "employee-verification-admin"}
            checked={permissions.employeeVerificationAdmin || false}
            onCheckedChange={(checked) => 
              onPermissionChange('employeeVerificationAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-employee-verification-admin" : "employee-verification-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Employee Verification Admin
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-grievances-admin" : "grievances-admin"}
            checked={permissions.grievancesAdmin || false}
            onCheckedChange={(checked) => 
              onPermissionChange('grievancesAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-grievances-admin" : "grievances-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Grievances Admin
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-transport-safety-admin" : "transport-safety-admin"}
            checked={permissions.transportSafetyAdmin || false}
            onCheckedChange={(checked) => 
              onPermissionChange('transportSafetyAdmin', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-transport-safety-admin" : "transport-safety-admin"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Transport Safety Admin
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-edusafe-resource-access" : "edusafe-resource-access"}
            checked={permissions.eduSafeResourceAccess || false}
            onCheckedChange={(checked) => 
              onPermissionChange('eduSafeResourceAccess', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-edusafe-resource-access" : "edusafe-resource-access"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            EduSafe Resource Access
          </label>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModulePermissions;
