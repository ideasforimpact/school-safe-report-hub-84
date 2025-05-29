
import { EmployeeData } from '@/contexts/auth/types';

export interface Module {
  id: string;
  name: string;
  key?: string;
  icon?: string;
  level: string;
  enabled: boolean;
  accessLevel?: Record<string, any>;
  order?: number; // Added order property
  url?: string; // Added url property
}

export interface EmployeeState {
  employeeData: EmployeeData | null;
  configuredModules: Module[];
  isLoading: boolean;
  error: string | null;
  clientId: string | null; // Added clientId property
}

export enum EmployeeActionTypes {
  SET_EMPLOYEE_DATA = 'SET_EMPLOYEE_DATA',
  SET_CONFIGURED_MODULES = 'SET_CONFIGURED_MODULES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  RESET_EMPLOYEE = 'RESET_EMPLOYEE',
  SET_CLIENT_ID = 'SET_CLIENT_ID' // Added new action type
}

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
  | SetEmployeeDataAction 
  | SetConfiguredModulesAction 
  | SetLoadingAction 
  | SetErrorAction
  | ResetEmployeeAction
  | SetClientIdAction;
