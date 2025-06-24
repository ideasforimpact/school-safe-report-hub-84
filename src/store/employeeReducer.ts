
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';
import { loadAuthState } from './authPersistence';

// Try to restore persisted authentication state
const restorePersistedAuthState = (): Partial<EmployeeState> => {
  const persistedState = loadAuthState();
  if (persistedState) {
    console.log("Restoring persisted auth state with modules:", persistedState.configuredModules?.length || 0, "and employee data:", !!persistedState.employeeData);
    return {
      currentUser: persistedState.currentUser,
      isAuthenticated: persistedState.isAuthenticated,
      isBackofficeUser: persistedState.isBackofficeUser,
      authError: persistedState.authError,
      configuredModules: persistedState.configuredModules || [],
      employeeData: persistedState.employeeData || null // Restore employeeData
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
  clientId: restoredState.employeeData?.clientId || null
};

export const employeeReducer = (
  state: EmployeeState = initialEmployeeState, 
  action: EmployeeAction | undefined
): EmployeeState => {
  if (!action) return state;

  console.log("REDUCER CALLED:", action.type);

  switch (action.type) {
    case EmployeeActionTypes.SET_CURRENT_USER:
      console.log("Setting current user in reducer:", action.payload);
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        authError: null
      };
      
    case EmployeeActionTypes.SET_BACKOFFICE_USER:
      console.log("Setting backoffice user in reducer:", action.payload);
      return {
        ...state,
        isBackofficeUser: action.payload
      };
      
    case EmployeeActionTypes.SET_AUTH_STATUS:
      console.log("Setting auth status in reducer:", action.payload);
      return {
        ...state,
        isAuthenticated: action.payload
      };
      
    case EmployeeActionTypes.SET_AUTH_ERROR:
      console.log("Setting auth error in reducer:", action.payload);
      return {
        ...state,
        authError: action.payload
      };
      
    case EmployeeActionTypes.CLEAR_AUTH:
      console.log("Clearing auth state in reducer");
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        isBackofficeUser: false,
        authError: null,
        configuredModules: [],
        employeeData: null // Clear employeeData on auth clear
      };
      
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      console.log("Setting employee data in reducer:", action.payload);
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId
      };
      
    case EmployeeActionTypes.SET_CONFIGURED_MODULES:
      console.log("Setting configured modules in reducer:", action.payload?.length || 0, "modules");
      return {
        ...state,
        configuredModules: action.payload
      };
      
    case EmployeeActionTypes.SET_LOADING:
      console.log("Setting loading state in reducer:", action.payload);
      return {
        ...state,
        isLoading: action.payload
      };
      
    case EmployeeActionTypes.SET_ERROR:
      console.log("Setting error in reducer:", action.payload);
      return {
        ...state,
        error: action.payload
      };
      
    case EmployeeActionTypes.SET_CLIENT_ID:
      console.log("Setting client ID in reducer:", action.payload);
      return {
        ...state,
        clientId: action.payload
      };
      
    case EmployeeActionTypes.RESET_EMPLOYEE:
      console.log("Resetting employee state in reducer");
      return {
        ...initialEmployeeState,
        configuredModules: [],
        employeeData: null
      };
      
    default:
      return state;
  }
};
