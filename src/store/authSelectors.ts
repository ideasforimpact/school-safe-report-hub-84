
import { EmployeeState } from './types';

// Authentication selectors
export const getCurrentUser = (state: EmployeeState) => state.currentUser;
export const getIsAuthenticated = (state: EmployeeState) => state.isAuthenticated;
export const getIsBackofficeUser = (state: EmployeeState) => state.isBackofficeUser;
export const getAuthError = (state: EmployeeState) => state.authError;

// Helper function to determine if user is admin (based on current user)
export const isUserAdmin = (state: EmployeeState) => {
  const user = state.currentUser;
  return user?.role === 'admin' || user?.modulePermissions?.superAdmin || false;
};

// Helper function to determine if user is saas owner
export const isUserSaasOwner = (state: EmployeeState) => {
  const user = state.currentUser;
  return user?.role === 'saas_owner' || state.isBackofficeUser || false;
};

// Helper function to determine if user is super admin (from current user or employee data)
export const isUserSuperAdmin = (state: EmployeeState) => {
  const user = state.currentUser;
  const employeeData = state.employeeData;
  return user?.isSuperAdmin === true || employeeData?.isSuperAdmin === true;
};
