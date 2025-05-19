
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

// Helper function to check if any module permission is enabled
export const hasAnyModulePermission = (state: EmployeeState): boolean => {
  const employeeData = state.employeeData;
  if (!employeeData || !employeeData.modulePermissions) return false;
  
  const permissions = employeeData.modulePermissions;
  return Object.values(permissions).some(permission => permission === true);
};

// Helper function to check if user has specific module permission
export const hasModulePermission = (state: EmployeeState, moduleKey: keyof ModulePermissions): boolean => {
  const employeeData = state.employeeData;
  if (!employeeData || !employeeData.modulePermissions) return false;
  
  return employeeData.modulePermissions[moduleKey] === true;
};
