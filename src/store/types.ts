
import { User } from '@/contexts/auth/types';

export interface EmployeeData {
  id: string;
  clientId: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin?: boolean;
  department?: string;
  employeeType?: string;
  client?: any;
  clientType?: any;
}

export interface Module {
  id: string;
  name: string;
  key: string;
  icon: string;
  level: string;
  enabled: boolean;
  accessLevel: any;
  order?: number;
  url?: string;
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
  homeClientId: string | null;
  activeClientId: string | null;
  isSwitchedContext: boolean;
  clientManagementReadOnly: boolean;
  switchedAccessLevel: 'R' | 'W/R';
  
  // Add logout state
  isLoggingOut: boolean;
}

export enum EmployeeActionTypes {
  SET_CURRENT_USER = 'SET_CURRENT_USER',
  SET_BACKOFFICE_USER = 'SET_BACKOFFICE_USER',
  SET_AUTH_STATUS = 'SET_AUTH_STATUS',
  SET_AUTH_ERROR = 'SET_AUTH_ERROR',
  CLEAR_AUTH = 'CLEAR_AUTH',
  SET_EMPLOYEE_DATA = 'SET_EMPLOYEE_DATA',
  SET_CONFIGURED_MODULES = 'SET_CONFIGURED_MODULES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_CLIENT_ID = 'SET_CLIENT_ID',
  SET_SWITCH_CONTEXT = 'SET_SWITCH_CONTEXT',
  RESET_SWITCH_CONTEXT = 'RESET_SWITCH_CONTEXT',
  RESET_EMPLOYEE = 'RESET_EMPLOYEE',
  SET_LOGOUT_STATE = 'SET_LOGOUT_STATE'
}

// Action interfaces
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

export interface SetEmployeeDataAction {
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA;
  payload: EmployeeData | null;
}

export interface SetConfiguredModulesAction {
  type: EmployeeActionTypes.SET_CONFIGURED_MODULES;
  payload: any[];
}

export interface SetLoadingAction {
  type: EmployeeActionTypes.SET_LOADING;
  payload: boolean;
}

export interface SetErrorAction {
  type: EmployeeActionTypes.SET_ERROR;
  payload: string | null;
}

export interface SetClientIdAction {
  type: EmployeeActionTypes.SET_CLIENT_ID;
  payload: string | null;
}

export interface SetSwitchContextAction {
  type: EmployeeActionTypes.SET_SWITCH_CONTEXT;
  payload: {
    homeClientId: string | null;
    activeClientId: string | null;
    isSwitchedContext: boolean;
    clientManagementReadOnly: boolean;
    switchedAccessLevel?: 'R' | 'W/R';
  };
}

export interface ResetSwitchContextAction {
  type: EmployeeActionTypes.RESET_SWITCH_CONTEXT;
}

export interface ResetEmployeeAction {
  type: EmployeeActionTypes.RESET_EMPLOYEE;
}

export interface SetLogoutStateAction {
  type: EmployeeActionTypes.SET_LOGOUT_STATE;
  payload: boolean;
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
  | SetClientIdAction
  | SetSwitchContextAction
  | ResetSwitchContextAction
  | ResetEmployeeAction
  | SetLogoutStateAction;
