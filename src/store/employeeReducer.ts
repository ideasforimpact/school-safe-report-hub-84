
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

  console.log("REDUCER CALLED:", action.type);

  switch (action.type) {
    case EmployeeActionTypes.SET_EMPLOYEE_DATA:
      // When setting employee data, also set clientId if available
      console.log("Setting employee data in reducer:", action.payload);
      return {
        ...state,
        employeeData: action.payload,
        clientId: action.payload?.clientId || state.clientId // Set clientId from payload if available
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
