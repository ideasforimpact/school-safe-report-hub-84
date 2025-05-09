
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePermissions } from '@/contexts/auth/types';

interface ModuleAccessTabProps {
  formData: {
    moduleAccess: Partial<ModulePermissions>;
  };
  handleModuleAccessChange: (module: keyof ModulePermissions, value: boolean) => void;
}

const ModuleAccessTab = ({ formData, handleModuleAccessChange }: ModuleAccessTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium">Module Access</label>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="super-admin"
              checked={formData.moduleAccess.superAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('superAdmin', checked === true)
              }
            />
            <label 
              htmlFor="super-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Super Admin
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="incident-reporting"
              checked={formData.moduleAccess.incidentReporting}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('incidentReporting', checked === true)
              }
            />
            <label 
              htmlFor="incident-reporting"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incident Reporting
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="incident-admin"
              checked={formData.moduleAccess.incidentAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('incidentAdmin', checked === true)
              }
            />
            <label 
              htmlFor="incident-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incident Admin
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="assessment-user"
              checked={formData.moduleAccess.assessmentUser}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('assessmentUser', checked === true)
              }
            />
            <label 
              htmlFor="assessment-user"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Assessment User
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="assessments-admin"
              checked={formData.moduleAccess.assessmentsAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('assessmentsAdmin', checked === true)
              }
            />
            <label 
              htmlFor="assessments-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Assessments Admin
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="employee-verification-admin"
              checked={formData.moduleAccess.employeeVerificationAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('employeeVerificationAdmin', checked === true)
              }
            />
            <label 
              htmlFor="employee-verification-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Employee Verification Admin
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="grievances-admin"
              checked={formData.moduleAccess.grievancesAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('grievancesAdmin', checked === true)
              }
            />
            <label 
              htmlFor="grievances-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Grievances Admin
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="transport-safety-admin"
              checked={formData.moduleAccess.transportSafetyAdmin}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('transportSafetyAdmin', checked === true)
              }
            />
            <label 
              htmlFor="transport-safety-admin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Transport Safety Admin
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="edusafe-resource-access"
              checked={formData.moduleAccess.eduSafeResourceAccess}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('eduSafeResourceAccess', checked === true)
              }
            />
            <label 
              htmlFor="edusafe-resource-access"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              EduSafe Resource Access
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleAccessTab;
