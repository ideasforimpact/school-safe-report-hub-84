
import { EmployeeState } from './types';
import { ModulePermissions } from '@/contexts/auth/types';

// Helper selector functions to get data from the Redux store
export const getEmployeeData = (state: EmployeeState) => state.employeeData;
export const getConfiguredModules = (state: EmployeeState) => state.configuredModules;
export const getEmployeeLoadingState = (state: EmployeeState) => state.isLoading;
export const getEmployeeError = (state: EmployeeState) => state.error;

// Helper function to determine if employee is a super admin
export const isEmployeeSuperAdmin = (state: EmployeeState) => 
  state.employeeData?.isSuperAdmin === true;

// Helper function to determine if employee is an admin
export const isEmployeeAdmin = (state: EmployeeState) => 
  state.employeeData ? true : false; // If we have employee data, consider them an admin

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
