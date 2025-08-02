
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';
import { loadAuthState } from './authPersistence';

// Try to restore persisted authentication state
const restorePersistedAuthState = (): Partial<EmployeeState> => {
  const persistedState = loadAuthState();
  if (persistedState) {
    return {
      currentUser: persistedState.currentUser,
      isAuthenticated: persistedState.isAuthenticated,
      isBackofficeUser: persistedState.isBackofficeUser,
      authError: persistedState.authError,
      configuredModules: persistedState.configuredModules || [],
      employeeData: persistedState.employeeData || null
    };
  }
  return {};
};

const restoredState = restorePersistedAuthState();

export const initialEmployeeState: EmployeeState = {
  // Authentication state - try to restore from persistence first
  currentUser: null,
  isAuthenticated: false,
  isBackofficeUser: false,
  authError: null,
  
  // Apply restored state
  ...restoredState,
  
  // Employee data - preserve restored modules and employeeData or default to empty
  employeeData: restoredState.employeeData || null,
  configuredModules: restoredState.configuredModules || [],
  isLoading: false,
  error: null,
  clientId: restoredState.employeeData?.clientId || null,
  isLoggingOut: false
};

export const employeeReducer = (
  state: EmployeeState = initialEmployeeState, 
  action: EmployeeAction | undefined
): EmployeeState => {
  if (!action) return state;

  switch (action.type) {
    case EmployeeActionTypes.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        authError: null
      };
      
    case EmployeeActionTypes.SET_BACKOFFICE_USER:
      return {
        ...state,
        isBackofficeUser: action.payload
      };
      
    case EmployeeActionTypes.SET_AUTH_STATUS:
      return {
        ...state,
        isAuthenticated: action.payload
      };
      
    case EmployeeActionTypes.SET_AUTH_ERROR:
      return {
        ...state,
        authError: action.payload
      };
      
    case EmployeeActionTypes.CLEAR_AUTH:
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        isBackofficeUser: false,
        authError: null,
        configuredModules: [],
        employeeData: null,
        clientId: null,
        isLoggingOut: false
      };
      
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId
      };
      
    case EmployeeActionTypes.SET_CONFIGURED_MODULES:
      return {
        ...state,
        configuredModules: action.payload
      };
      
    case EmployeeActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case EmployeeActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case EmployeeActionTypes.SET_CLIENT_ID:
      return {
        ...state,
        clientId: action.payload
      };
      
    case EmployeeActionTypes.SET_LOGOUT_STATE:
      return {
        ...state,
        isLoggingOut: action.payload
      };
      
    case EmployeeActionTypes.RESET_EMPLOYEE:
      return {
        currentUser: null,
        isAuthenticated: false,
        isBackofficeUser: false,
        authError: null,
        employeeData: null,
        configuredModules: [],
        isLoading: false,
        error: null,
        clientId: null,
        isLoggingOut: false
      };
      
    default:
      return state;
  }
};
