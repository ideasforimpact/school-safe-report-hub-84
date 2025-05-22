
import {
  EmployeeActionTypes,
  SetEmployeeDataAction,
  SetConfiguredModulesAction,
  SetLoadingAction,
  SetErrorAction,
  ResetEmployeeAction,
  SetClientIdAction,
  Module
} from './types';
import { EmployeeData } from '@/contexts/auth/types';

export const setEmployeeData = (employeeData: EmployeeData | any): SetEmployeeDataAction => ({
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
  payload: employeeData
});

export const setConfiguredModules = (modules: Module[]): SetConfiguredModulesAction => ({
  type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
  payload: modules
});

export const setLoading = (isLoading: boolean): SetLoadingAction => ({
  type: EmployeeActionTypes.SET_LOADING,
  payload: isLoading
});

export const setError = (error: string | null): SetErrorAction => ({
  type: EmployeeActionTypes.SET_ERROR,
  payload: error
});

export const resetEmployee = (): ResetEmployeeAction => ({
  type: EmployeeActionTypes.RESET_EMPLOYEE
});

export const setClientId = (clientId: string | null): SetClientIdAction => ({
  type: EmployeeActionTypes.SET_CLIENT_ID,
  payload: clientId
});
