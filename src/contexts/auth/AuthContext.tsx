
import { createContext } from 'react';
import { AuthContextType } from './types';

// Create a default value that matches the AuthContextType shape
const defaultValue: AuthContextType = {
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => false,
  logout: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
};

// Create and export the context
export const AuthContext = createContext<AuthContextType>(defaultValue);
