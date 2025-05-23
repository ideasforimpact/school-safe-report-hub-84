
import { createContext } from 'react';
import { AuthContextType } from './types';

// Create a default value that matches the AuthContextType shape
const defaultValue: AuthContextType = {
  user: null,
  users: [],
  isAdmin: false,
  isSaasOwner: false,
  isAuthenticated: false,
  authError: null,
  login: async () => false,
  logout: async () => {},
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
  deactivateUser: () => {},
  reactivateUser: () => {},
  changePassword: async () => false,
  handleUserAuthentication: async () => {},
  employeeData: null,
};

// Create and export the context
export const AuthContext = createContext<AuthContextType>(defaultValue);
