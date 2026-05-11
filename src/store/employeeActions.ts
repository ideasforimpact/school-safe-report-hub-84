
import {
  EmployeeActionTypes,
  SetEmployeeDataAction,
  SetConfiguredModulesAction,
  SetLoadingAction,
  SetErrorAction,
  SetClientIdAction,
  SetSwitchContextAction,
  ResetSwitchContextAction,
  ResetEmployeeAction,
  SetLogoutStateAction
} from './types';
import { EmployeeData } from './types';

export const setEmployeeData = (employeeData: EmployeeData | null): SetEmployeeDataAction => {
  return {
    type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
    payload: employeeData
  };
};

export const setConfiguredModules = (modules: any[]): SetConfiguredModulesAction => {
  return {
    type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
    payload: modules
  };
};

export const setLoading = (isLoading: boolean): SetLoadingAction => {
  return {
    type: EmployeeActionTypes.SET_LOADING,
    payload: isLoading
  };
};

export const setError = (error: string | null): SetErrorAction => {
  return {
    type: EmployeeActionTypes.SET_ERROR,
    payload: error
  };
};

export const setClientId = (clientId: string | null): SetClientIdAction => {
  return {
    type: EmployeeActionTypes.SET_CLIENT_ID,
    payload: clientId
  };
};

export const setSwitchContext = (payload: {
  homeClientId: string | null;
  activeClientId: string | null;
  isSwitchedContext: boolean;
  clientManagementReadOnly: boolean;
  switchedAccessLevel?: 'R' | 'W/R';
}): SetSwitchContextAction => {
  return {
    type: EmployeeActionTypes.SET_SWITCH_CONTEXT,
    payload
  };
};

export const resetSwitchContext = (): ResetSwitchContextAction => {
  return {
    type: EmployeeActionTypes.RESET_SWITCH_CONTEXT
  };
};

export const resetEmployee = (): ResetEmployeeAction => {
  return {
    type: EmployeeActionTypes.RESET_EMPLOYEE
  };
};

export const setLogoutState = (isLoggingOut: boolean): SetLogoutStateAction => {
  return {
    type: EmployeeActionTypes.SET_LOGOUT_STATE,
    payload: isLoggingOut
  };
};
