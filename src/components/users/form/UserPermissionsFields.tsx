
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
            id={isEditMode ? "edit-all-incidents" : "all-incidents"}
            checked={permissions.allIncidents}
            onCheckedChange={(checked) => 
              onPermissionChange('allIncidents', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-all-incidents" : "all-incidents"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            All Incidents
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-insights" : "insights"}
            checked={permissions.insights}
            onCheckedChange={(checked) => 
              onPermissionChange('insights', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-insights" : "insights"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Insights
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id={isEditMode ? "edit-benchmarking" : "benchmarking"}
            checked={permissions.benchmarking}
            onCheckedChange={(checked) => 
              onPermissionChange('benchmarking', checked === true)
            }
          />
          <label 
            htmlFor={isEditMode ? "edit-benchmarking" : "benchmarking"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Benchmarking
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsFields;
