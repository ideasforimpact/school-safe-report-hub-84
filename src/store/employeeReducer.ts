
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';
import { loadAuthState } from './authPersistence';

// Try to restore persisted authentication state
const restorePersistedAuthState = (): Partial<EmployeeState> => {
  const persistedState = loadAuthState();
  if (persistedState) {
    const restoredHomeClientId =
      persistedState.employeeData?.homeClientId ||
      persistedState.employeeData?.clientId ||
      null;
    const restoredEmployeeData = persistedState.employeeData
      ? {
          ...persistedState.employeeData,
          homeClientId:
            persistedState.employeeData.homeClientId ??
            restoredHomeClientId,
        }
      : null;

    return {
      currentUser: persistedState.currentUser,
      isAuthenticated: persistedState.isAuthenticated,
      isBackofficeUser: persistedState.isBackofficeUser,
      authError: persistedState.authError,
      configuredModules: persistedState.configuredModules || [],
      employeeData: restoredEmployeeData,
      activeClientId:
        persistedState.activeClientId ||
        restoredHomeClientId,
      isSwitchedContext: persistedState.isSwitchedContext === true,
      clientManagementReadOnly: persistedState.clientManagementReadOnly === true,
      switchedAccessLevel: (() => {
        const raw = (persistedState.switchedAccessLevel as unknown as string | undefined) || 'R';
        if (raw === 'full_access') return 'W/R';
        if (raw === 'read_only') return 'R';
        return raw as 'R' | 'W/R';
      })(),
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
  activeClientId:
    restoredState.activeClientId ||
    restoredState.employeeData?.homeClientId ||
    restoredState.employeeData?.clientId ||
    null,
  isSwitchedContext: restoredState.isSwitchedContext === true,
  clientManagementReadOnly: restoredState.clientManagementReadOnly === true,
  switchedAccessLevel: restoredState.switchedAccessLevel || 'R',
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
        activeClientId: null,
        isSwitchedContext: false,
        clientManagementReadOnly: false,
        switchedAccessLevel: 'R',
        isLoggingOut: false
      };
      
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      const nextHomeClientId =
        action.payload?.homeClientId ??
        action.payload?.clientId ??
        (state.employeeData ? state.employeeData.homeClientId : null) ??
        null;
      return {
        ...state,
        employeeData: action.payload
          ? {
              ...action.payload,
              homeClientId: nextHomeClientId,
            }
          : null,
        clientId: state.isSwitchedContext ? state.clientId : (action.payload?.clientId || state.clientId),
        activeClientId: state.isSwitchedContext
          ? state.activeClientId
          : (action.payload?.clientId || state.activeClientId || state.clientId)
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
        clientId: action.payload,
        activeClientId: action.payload,
        employeeData: state.employeeData
          ? {
              ...state.employeeData,
              homeClientId: state.employeeData.homeClientId || state.employeeData.clientId || null,
              clientId: action.payload || state.employeeData.clientId,
            }
          : state.employeeData
      };

    case EmployeeActionTypes.SET_SWITCH_CONTEXT:
      return {
        ...state,
        activeClientId: action.payload.activeClientId,
        isSwitchedContext: action.payload.isSwitchedContext,
        clientManagementReadOnly: action.payload.clientManagementReadOnly,
        switchedAccessLevel: action.payload.switchedAccessLevel || 'R',
        clientId: action.payload.activeClientId,
        employeeData: state.employeeData
          ? {
              ...state.employeeData,
              homeClientId: action.payload.homeClientId,
              clientId: action.payload.activeClientId || state.employeeData.clientId,
            }
          : state.employeeData
      };

    case EmployeeActionTypes.RESET_SWITCH_CONTEXT:
      const resetHomeClientId = state.employeeData ? state.employeeData.homeClientId || null : null;
      return {
        ...state,
        activeClientId: resetHomeClientId,
        isSwitchedContext: false,
        clientManagementReadOnly: false,
        switchedAccessLevel: 'R',
        clientId: resetHomeClientId,
        employeeData: state.employeeData
          ? {
              ...state.employeeData,
              homeClientId: resetHomeClientId,
              clientId: resetHomeClientId || state.employeeData.clientId,
            }
          : state.employeeData
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
        activeClientId: null,
        isSwitchedContext: false,
        clientManagementReadOnly: false,
        switchedAccessLevel: 'R',
        isLoggingOut: false
      };
      
    default:
      return state;
  }
};
