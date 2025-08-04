import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { hasModulePermission, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

/**
 * Component to show current module permissions status
 * This helps visualize when module permissions change in real-time
 */
const ModulePermissionsStatus: React.FC = () => {
  const { state } = useEmployeeStore();
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  // List of common module keys to check
  const moduleKeys = [
    'incidentReporting',
    'incidentAdmin',
    'assessmentUser',
    'assessmentsAdmin',
    'employeeVerificationAdmin',
    'grievancesAdmin',
    'transportSafetyAdmin',
    'eduSafeResourceAccess'
  ];

  const formatModuleName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Current Module Access</CardTitle>
        <CardDescription>
          Your current module permissions - updates automatically when changed by administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isSuperAdmin && (
            <div className="mb-4">
              <Badge variant="default" className="bg-purple-500 text-white">
                Super Administrator
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                You have access to all available modules
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {moduleKeys.map(moduleKey => {
              const hasAccess = hasModulePermission(state, moduleKey as any);
              
              return (
                <div key={moduleKey} className="flex items-center space-x-2">
                  <Badge 
                    variant={hasAccess ? "default" : "outline"}
                    className={hasAccess ? "bg-green-500 text-white" : ""}
                  >
                    {formatModuleName(moduleKey)}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {state.configuredModules.length === 0 && !isSuperAdmin && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No modules assigned</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModulePermissionsStatus;