
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';

export const initialEmployeeState: EmployeeState = {
  // Authentication state
  currentUser: null,
  isAuthenticated: false,
  isBackofficeUser: false,
  authError: null,
  
  // Employee data
  employeeData: null,
  configuredModules: [],
  isLoading: false,
  error: null,
  clientId: null
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
        authError: null
      };
      
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      console.log("Setting employee data in reducer:", action.payload);
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId
      };
      
    case EmployeeActionTypes.SET_CONFIGURED_MODULES:
      console.log("Setting configured modules in reducer:", action.payload);
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
      return initialEmployeeState;
      
    default:
      return state;
  }
};
