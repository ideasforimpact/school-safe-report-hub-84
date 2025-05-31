
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

export const setEmployeeData = (employeeData: EmployeeData | any): SetEmployeeDataAction => {
  //console.log("setEmployeeData action creator called with:", employeeData);
  return {
    type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
    payload: employeeData
  };
};

export const setConfiguredModules = (modules: Module[]): SetConfiguredModulesAction => {
  //console.log("setConfiguredModules action creator called with:", modules.length, "modules");
  return {
    type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
    payload: modules
  };
};

export const setLoading = (isLoading: boolean): SetLoadingAction => {
  //console.log("setLoading action creator called with:", isLoading);
  return {
    type: EmployeeActionTypes.SET_LOADING,
    payload: isLoading
  };
};

export const setError = (error: string | null): SetErrorAction => {
  //console.log("setError action creator called with:", error);
  return {
    type: EmployeeActionTypes.SET_ERROR,
    payload: error
  };
};

export const resetEmployee = (): ResetEmployeeAction => {
  //console.log("resetEmployee action creator called");
  return {
    type: EmployeeActionTypes.RESET_EMPLOYEE
  };
};

export const setClientId = (clientId: string | null): SetClientIdAction => {
  //console.log("setClientId action creator called with:", clientId);
  return {
    type: EmployeeActionTypes.SET_CLIENT_ID,
    payload: clientId
  };
};
