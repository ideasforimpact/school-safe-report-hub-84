
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';

export const initialEmployeeState: EmployeeState = {
  employeeData: null,
  configuredModules: [],
  isLoading: false,
  error: null,
  clientId: null // Initialize clientId as null
};

export const employeeReducer = (
  state: EmployeeState = initialEmployeeState, 
  action: EmployeeAction | undefined
): EmployeeState => {
  // Guard against undefined actions
  if (!action) return state;

  switch (action.type) {
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      console.log(action,"employee payload")
      // When setting employee data, also set clientId if available
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId // Set clientId from payload if available
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
    case EmployeeActionTypes.RESET_EMPLOYEE:
      return initialEmployeeState;
    default:
      return state;
  }
};
