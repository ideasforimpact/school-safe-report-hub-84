
import { EmployeeData } from '@/contexts/auth/types';
import { 
  EmployeeActionTypes, 
  SetEmployeeDataAction, 
  SetConfiguredModulesAction, 
  SetLoadingAction, 
  SetErrorAction,
  ResetEmployeeAction,
  Module
} from './types';

export const setEmployeeData = (data: EmployeeData): SetEmployeeDataAction => ({
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
  payload: data
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
