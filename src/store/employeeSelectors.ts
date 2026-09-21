
import { EmployeeState } from './types';
import { ModulePermissions } from '@/contexts/auth/types';

// Helper selector functions to get data from the Redux store
export const getEmployeeData = (state: EmployeeState) => state.employeeData;
export const getConfiguredModules = (state: EmployeeState) => state.configuredModules;
export const getEmployeeLoadingState = (state: EmployeeState) => state.isLoading;
export const getEmployeeError = (state: EmployeeState) => state.error;
export const getHomeClientId = (state: EmployeeState) =>
  state.employeeData ? state.employeeData.homeClientId || null : null;
export const getActiveClientId = (state: EmployeeState) => state.activeClientId;
export const getIsSwitchedContext = (state: EmployeeState) => state.isSwitchedContext;
export const getClientManagementReadOnly = (state: EmployeeState) => state.clientManagementReadOnly;

// Helper function to determine if employee is a super admin
// Explicitly check that the value is true, not just truthy
export const isEmployeeSuperAdmin = (state: EmployeeState) => 
  state.employeeData?.isSuperAdmin === true;

// Helper function to determine if employee is an admin
// If we have employee data in Redux, consider them an admin
export const isEmployeeAdmin = (state: EmployeeState) => 
  state.employeeData ? true : false;

// Helper function to check if any module is enabled from configured modules
export const hasAnyModulePermission = (state: EmployeeState): boolean => {
  const modules = state.configuredModules;
  if (!modules || modules.length === 0) return false;
  
  return modules.some(module => module.enabled === true);
};

// Helper function to check if user has specific module permission from configured modules
export const hasModulePermission = (state: EmployeeState, moduleKey: keyof ModulePermissions): boolean => {
  // Super admins have access to everything
  if (isEmployeeSuperAdmin(state)) return true;

  // Otherwise check if the module exists and is enabled in configured modules
  const modules = state.configuredModules;
  if (!modules || modules.length === 0) return false;

  return modules.some(module =>
    module.key === moduleKey && module.enabled === true
  );
};

// Helper function to check whether the employee has "Admin" access level for a
// specific module (matched by name, case-insensitive) — same pattern used by
// useIncidentPermissions/useAssessmentAccess for Incident/Assessment. Admin
// scope means "see all client records for this module" vs. own-records-only.
export const isModuleAdmin = (state: EmployeeState, moduleName: string): boolean => {
  if (isEmployeeSuperAdmin(state)) return true;

  const modules = state.configuredModules;
  if (!modules || modules.length === 0) return false;

  const target = moduleName.toLowerCase();
  const module = modules.find(m => m.name?.toLowerCase() === target);
  if (!module) return false;

  const level = (module.accessLevel ?? module.level) as unknown as { is_admin?: boolean; isAdmin?: boolean } | null;
  return level?.is_admin === true || level?.isAdmin === true;
};
