

import { EmployeeData, ModulePermissions } from '@/contexts/auth/types';

export interface Module {
  id: string;
  name: string;
  key?: string;
  icon?: string;
  level: string; // Added level property to match sidebarConfig Module type
  enabled: boolean;
  accessLevel?: ModulePermissions;
}

export interface EmployeeState {
  employeeData: EmployeeData | null;
  configuredModules: Module[];
  isLoading: boolean;
  error: string | null;
}

export enum EmployeeActionTypes {
  SET_EMPLOYEE_DATA = 'SET_EMPLOYEE_DATA',
  SET_CONFIGURED_MODULES = 'SET_CONFIGURED_MODULES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  RESET_EMPLOYEE = 'RESET_EMPLOYEE'
}

export interface SetEmployeeDataAction {
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA;
  payload: EmployeeData;
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

export type EmployeeAction = 
  | SetEmployeeDataAction 
  | SetConfiguredModulesAction 
  | SetLoadingAction 
  | SetErrorAction
  | ResetEmployeeAction;
