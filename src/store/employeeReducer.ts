
import { EmployeeState, EmployeeAction, EmployeeActionTypes } from './types';

export const initialEmployeeState: EmployeeState = {
  employeeData: null,
  configuredModules: [],
  isLoading: false,
  error: null
};

export const employeeReducer = (
  state: EmployeeState = initialEmployeeState, 
  action: EmployeeAction | undefined
): EmployeeState => {
  // Guard against undefined actions
  if (!action) return state;

  switch (action.type) {
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      return {
        ...state,
        employeeData: action.payload
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
    case EmployeeActionTypes.RESET_EMPLOYEE:
      return initialEmployeeState;
    default:
      return state;
  }
};
