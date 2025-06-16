import { EmployeeData } from '@/contexts/auth/types';

export interface Module {
  id: string;
  name: string;
  key?: string;
  icon?: string;
  level: string;
  enabled: boolean;
  accessLevel?: Record<string, any>;
  order?: number;
  url?: string;
}

// Add User interface to Redux types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  modulePermissions?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
  provider?: string;
  clientId?: string | null;
  employeeId?: string;
  employeeType?: string;
  department?: string;
  joiningDate?: string;
  isSuperAdmin?: boolean;
  client?: any;
  clientType?: any;
}

export interface EmployeeState {
  // Authentication state
  currentUser: User | null;
  isAuthenticated: boolean;
  isBackofficeUser: boolean;
  authError: string | null;
  
  // Employee data
  employeeData: EmployeeData | null;
  configuredModules: Module[];
  isLoading: boolean;
  error: string | null;
  clientId: string | null;
}

export enum EmployeeActionTypes {
  // Authentication actions
  SET_CURRENT_USER = 'SET_CURRENT_USER',
  SET_BACKOFFICE_USER = 'SET_BACKOFFICE_USER',
  SET_AUTH_STATUS = 'SET_AUTH_STATUS',
  SET_AUTH_ERROR = 'SET_AUTH_ERROR',
  CLEAR_AUTH = 'CLEAR_AUTH',
  
  // Employee data actions
  SET_EMPLOYEE_DATA = 'SET_EMPLOYEE_DATA',
  SET_CONFIGURED_MODULES = 'SET_CONFIGURED_MODULES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  RESET_EMPLOYEE = 'RESET_EMPLOYEE',
  SET_CLIENT_ID = 'SET_CLIENT_ID'
}

// Authentication action interfaces
export interface SetCurrentUserAction {
  type: EmployeeActionTypes.SET_CURRENT_USER;
  payload: User | null;
}

export interface SetBackofficeUserAction {
  type: EmployeeActionTypes.SET_BACKOFFICE_USER;
  payload: boolean;
}

export interface SetAuthStatusAction {
  type: EmployeeActionTypes.SET_AUTH_STATUS;
  payload: boolean;
}

export interface SetAuthErrorAction {
  type: EmployeeActionTypes.SET_AUTH_ERROR;
  payload: string | null;
}

export interface ClearAuthAction {
  type: EmployeeActionTypes.CLEAR_AUTH;
}

// Existing action interfaces
export interface SetEmployeeDataAction {
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA;
  payload: EmployeeData | null;
}

export interface SetConfiguredModulesAction {
  type: EmployeeActionTypes.SET_CONFIGURED_MODULES;
  payload: Module[];
}

export interface SetLoadingAction {
  type: EmployeeActionTypes.SET_LOADING;
  payload: boolean;
}

export interface SetErrorAction {
  type: EmployeeActionTypes.SET_ERROR;
  payload: string | null;
}

export interface ResetEmployeeAction {
  type: EmployeeActionTypes.RESET_EMPLOYEE;
}

export interface SetClientIdAction {
  type: EmployeeActionTypes.SET_CLIENT_ID;
  payload: string | null;
}

export type EmployeeAction = 
  | SetCurrentUserAction
  | SetBackofficeUserAction
  | SetAuthStatusAction
  | SetAuthErrorAction
  | ClearAuthAction
  | SetEmployeeDataAction 
  | SetConfiguredModulesAction 
  | SetLoadingAction 
  | SetErrorAction
  | ResetEmployeeAction
  | SetClientIdAction;
