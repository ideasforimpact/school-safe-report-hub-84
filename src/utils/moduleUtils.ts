
import { Module } from '@/store/types';
import { ModulePermissions } from '@/contexts/auth/types';

// Convert module list to a format usable by the Module Access section
export const getModulesList = (configuredModules: Module[]) => {
  // If no modules are configured, return a default list
  if (!configuredModules || configuredModules.length === 0) {
    return [
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
  }

  // Map from configured modules
  return configuredModules.map(module => ({
    key: module.key || module.id,
    name: module.name
  }));
};

// Initialize module permissions based on configured modules
export const initializeModulePermissions = (configuredModules: Module[]): ModulePermissions => {
  const permissions: ModulePermissions = {
    superAdmin: false,
    incidentReporting: false,
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false, 
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: false
  };

  // Enable permissions for each configured module
  configuredModules.forEach(module => {
    const key = module.key as keyof ModulePermissions;
    if (key && key in permissions) {
      permissions[key] = true;
    }
  });

  return permissions;
};
