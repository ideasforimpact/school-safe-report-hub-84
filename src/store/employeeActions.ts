import {
  EmployeeActionTypes,
  EmployeeAction,
  User,
  Module,
  EmployeeData
} from './types';

export const setCurrentUser = (user: User | null): EmployeeAction => ({
  type: EmployeeActionTypes.SET_CURRENT_USER,
  payload: user
});

export const setBackofficeUser = (isBackofficeUser: boolean): EmployeeAction => ({
  type: EmployeeActionTypes.SET_BACKOFFICE_USER,
  payload: isBackofficeUser
});

export const setAuthStatus = (isAuthenticated: boolean): EmployeeAction => ({
  type: EmployeeActionTypes.SET_AUTH_STATUS,
  payload: isAuthenticated
});

export const setAuthError = (error: string | null): EmployeeAction => ({
  type: EmployeeActionTypes.SET_AUTH_ERROR,
  payload: error
});

export const clearAuth = (): EmployeeAction => ({
  type: EmployeeActionTypes.CLEAR_AUTH
});

export const setEmployeeData = (employeeData: EmployeeData | null): EmployeeAction => ({
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
  payload: employeeData
});

export const setConfiguredModules = (modules: Module[]): EmployeeAction => ({
  type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
  payload: modules
});

export const setModulesRestored = (restored: boolean): EmployeeAction => ({
  type: EmployeeActionTypes.SET_MODULES_RESTORED,
  payload: restored
});

export const setLoading = (isLoading: boolean): EmployeeAction => ({
  type: EmployeeActionTypes.SET_LOADING,
  payload: isLoading
});

export const setError = (error: string | null): EmployeeAction => ({
  type: EmployeeActionTypes.SET_ERROR,
  payload: error
});

export const setClientId = (clientId: string | null): EmployeeAction => ({
  type: EmployeeActionTypes.SET_CLIENT_ID,
  payload: clientId
});

export const resetEmployee = (): EmployeeAction => ({
  type: EmployeeActionTypes.RESET_EMPLOYEE
});
