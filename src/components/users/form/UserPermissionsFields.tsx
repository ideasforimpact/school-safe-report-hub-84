
import React from 'react';
import { ModulePermissions } from '@/contexts/AuthContext';
import { Checkbox } from "@/components/ui/checkbox";

interface UserPermissionsFieldsProps {
  permissions: ModulePermissions;
  onPermissionChange: (module: keyof ModulePermissions, value: boolean) => void;
  isEditMode?: boolean;
}

const UserPermissionsFields = ({ 
  permissions, 
  onPermissionChange,
  isEditMode = false 
}: UserPermissionsFieldsProps) => {
  return (
    <div className="space-y-2">
      <label className="font-medium">Module Permissions</label>
      <div className="grid grid-cols-1 gap-2 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-incident-reporting" : "incident-reporting"}
            checked={permissions.incidentReporting}
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
            checked={permissions.incidentAdmin}
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
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-assessment-user" : "assessment-user"}
            checked={permissions.assessmentUser}
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
            checked={permissions.assessmentsAdmin}
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
      </div>
    </div>
  );
};

export default UserPermissionsFields;
