
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';
import { loadAuthState } from './authPersistence';

// Try to restore persisted authentication state
const restorePersistedAuthState = (): Partial<EmployeeState> => {
  const persistedState = loadAuthState();
  if (persistedState) {
    console.log('🔄 employeeReducer: Restoring persisted state:', persistedState);
    return {
      currentUser: persistedState.currentUser,
      isAuthenticated: persistedState.isAuthenticated,
      isBackofficeUser: persistedState.isBackofficeUser,
      authError: persistedState.authError,
      configuredModules: persistedState.configuredModules || [],
      employeeData: persistedState.employeeData || null
    };
  }
  console.log('🔄 employeeReducer: No persisted state found');
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

  console.log('🔧 employeeReducer: Processing action:', action.type, 'payload' in action ? action.payload : 'no payload');

  switch (action.type) {
    case EmployeeActionTypes.SET_CURRENT_USER:
      console.log('✅ employeeReducer: Setting current user:', action.payload);
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        authError: null
      };
      
    case EmployeeActionTypes.SET_BACKOFFICE_USER:
      console.log('✅ employeeReducer: Setting backoffice user status:', action.payload);
      return {
        ...state,
        isBackofficeUser: action.payload
      };
      
    case EmployeeActionTypes.SET_AUTH_STATUS:
      console.log('✅ employeeReducer: Setting auth status:', action.payload);
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
      console.log('🧹 employeeReducer: Clearing auth state');
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        isBackofficeUser: false,
        authError: null,
        configuredModules: [],
        employeeData: null
      };
      
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      console.log('✅ employeeReducer: Setting employee data:', action.payload);
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId
      };
      
    case EmployeeActionTypes.SET_CONFIGURED_MODULES:
      console.log('✅ employeeReducer: Setting configured modules:', action.payload?.length || 0, 'modules');
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
      console.log('🔄 employeeReducer: Resetting employee state');
      return {
        ...initialEmployeeState,
        configuredModules: [],
        employeeData: null,
        isLoggingOut: false
      };
      
    default:
      return state;
  }
};
