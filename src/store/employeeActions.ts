
import {
  EmployeeActionTypes,
  SetEmployeeDataAction,
  SetConfiguredModulesAction,
  SetLoadingAction,
  SetErrorAction,
  SetClientIdAction,
  ResetEmployeeAction,
  SetLogoutStateAction
} from './types';
import { EmployeeData } from './types';

export const setEmployeeData = (employeeData: EmployeeData | null): SetEmployeeDataAction => {
  console.log("setEmployeeData action creator called with:", employeeData);
  return {
    type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
    payload: employeeData
  };
};

export const setConfiguredModules = (modules: any[]): SetConfiguredModulesAction => {
  console.log("setConfiguredModules action creator called with:", modules?.length || 0, "modules");
  return {
    type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
    payload: modules
  };
};

export const setLoading = (isLoading: boolean): SetLoadingAction => {
  console.log("setLoading action creator called with:", isLoading);
  return {
    type: EmployeeActionTypes.SET_LOADING,
    payload: isLoading
  };
};

export const setError = (error: string | null): SetErrorAction => {
  console.log("setError action creator called with:", error);
  return {
    type: EmployeeActionTypes.SET_ERROR,
    payload: error
  };
};

export const setClientId = (clientId: string | null): SetClientIdAction => {
  console.log("setClientId action creator called with:", clientId);
  return {
    type: EmployeeActionTypes.SET_CLIENT_ID,
    payload: clientId
  };
};

export const resetEmployee = (): ResetEmployeeAction => {
  console.log("resetEmployee action creator called");
  return {
    type: EmployeeActionTypes.RESET_EMPLOYEE
  };
};

export const setLogoutState = (isLoggingOut: boolean): SetLogoutStateAction => {
  console.log("setLogoutState action creator called with:", isLoggingOut);
  return {
    type: EmployeeActionTypes.SET_LOGOUT_STATE,
    payload: isLoggingOut
  };
};
