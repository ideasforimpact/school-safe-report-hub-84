
import { EmployeeState } from './types';

// Helper selector functions to get data from the Redux store
export const getEmployeeData = (state: EmployeeState) => state.employeeData;
export const getConfiguredModules = (state: EmployeeState) => state.configuredModules;
export const getEmployeeLoadingState = (state: EmployeeState) => state.isLoading;
export const getEmployeeError = (state: EmployeeState) => state.error;

// Helper function to determine if employee is a super admin
export const isEmployeeSuperAdmin = (state: EmployeeState) => 
  state.employeeData?.isSuperAdmin === true;
