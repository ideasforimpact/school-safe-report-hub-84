
import {
  EmployeeActionTypes,
  SetCurrentUserAction,
  SetBackofficeUserAction,
  SetAuthStatusAction,
  SetAuthErrorAction,
  ClearAuthAction
} from './types';
import { User } from '@/contexts/auth/types';

export const setCurrentUser = (user: User | null): SetCurrentUserAction => {
  console.log("setCurrentUser action creator called with:", user);
  return {
    type: EmployeeActionTypes.SET_CURRENT_USER,
    payload: user
  };
};

export const setBackofficeUser = (isBackoffice: boolean): SetBackofficeUserAction => {
  console.log("setBackofficeUser action creator called with:", isBackoffice);
  return {
    type: EmployeeActionTypes.SET_BACKOFFICE_USER,
    payload: isBackoffice
  };
};

export const setAuthStatus = (isAuthenticated: boolean): SetAuthStatusAction => {
  console.log("setAuthStatus action creator called with:", isAuthenticated);
  return {
    type: EmployeeActionTypes.SET_AUTH_STATUS,
    payload: isAuthenticated
  };
};

export const setAuthError = (error: string | null): SetAuthErrorAction => {
  console.log("setAuthError action creator called with:", error);
  return {
    type: EmployeeActionTypes.SET_AUTH_ERROR,
    payload: error
  };
};

export const clearAuth = (): ClearAuthAction => {
  console.log("clearAuth action creator called");
  return {
    type: EmployeeActionTypes.CLEAR_AUTH
  };
};
