
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";

interface ModuleAccessTabProps {
  formData: {
    moduleAccess: {
      incidentReporting: boolean;
      allIncidents: boolean;
      insights: boolean;
      benchmarking: boolean;
    };
  };
  handleModuleAccessChange: (module: string, value: boolean) => void;
}

const ModuleAccessTab = ({ formData, handleModuleAccessChange }: ModuleAccessTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium">Module Access</label>
        <div className="grid grid-cols-1 gap-2 pt-2">
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
              id="all-incidents"
              checked={formData.moduleAccess.allIncidents}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('allIncidents', checked === true)
              }
            />
            <label 
              htmlFor="all-incidents"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              All Incidents
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="insights"
              checked={formData.moduleAccess.insights}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('insights', checked === true)
              }
            />
            <label 
              htmlFor="insights"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Insights
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="benchmarking"
              checked={formData.moduleAccess.benchmarking}
              onCheckedChange={(checked) => 
                handleModuleAccessChange('benchmarking', checked === true)
              }
            />
            <label 
              htmlFor="benchmarking"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Benchmarking
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleAccessTab;
