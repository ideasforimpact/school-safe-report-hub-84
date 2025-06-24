
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
  return {
    type: EmployeeActionTypes.SET_CURRENT_USER,
    payload: user
  };
};

export const setBackofficeUser = (isBackoffice: boolean): SetBackofficeUserAction => {
  return {
    type: EmployeeActionTypes.SET_BACKOFFICE_USER,
    payload: isBackoffice
  };
};

export const setAuthStatus = (isAuthenticated: boolean): SetAuthStatusAction => {
  return {
    type: EmployeeActionTypes.SET_AUTH_STATUS,
    payload: isAuthenticated
  };
};

export const setAuthError = (error: string | null): SetAuthErrorAction => {
  return {
    type: EmployeeActionTypes.SET_AUTH_ERROR,
    payload: error
  };
};

export const clearAuth = (): ClearAuthAction => {
  return {
    type: EmployeeActionTypes.CLEAR_AUTH
  };
};
