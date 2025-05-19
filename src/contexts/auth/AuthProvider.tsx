
import React, { createContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, UserWithPassword, EmployeeData } from './types';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useAuthState } from './hooks/useAuthState';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// Context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSaasOwner: boolean;
  isAdmin: boolean;
  modulePermissions: any;
  authError: string | null;
  employeeData: EmployeeData | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: any) => void;
  updateUser: (id: string, updates: any) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  cachedBackofficeModules: any[];
  cachedClientModules: any[];
};

// Create the context
export const AuthContext = createContext<AuthContextType>(null!);

// Auth provider props type
type AuthProviderProps = {
  children: React.ReactNode;
};

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const location = useLocation();
  
  // User state and initial data
  const { 
    user, 
    users, 
    setUser, 
    setUsers, 
    authError, 
    setAuthError,
    isLoading,
    isSaasOwner,
    isAdmin,
    modulePermissions,
    employeeData,
    setEmployeeData
  } = useAuthState();
  
  // Authentication initialization tracking
  const authInitCompleteRef = useRef<boolean>(false);
  
  // Cached modules from direct fetch
  const [cachedBackofficeModules, setCachedBackofficeModules] = useState<any[]>([]);
  const [cachedClientModules, setCachedClientModules] = useState<any[]>([]);
  
  // Set both backoffice and client modules at once
  const setCachedModules = (backofficeModules: any[], clientModules: any[]) => {
    setCachedBackofficeModules(backofficeModules);
    setCachedClientModules(clientModules);
  };

  // Auth operation handlers
  const {
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changeUserPassword,
    handleUserAuthentication,
  } = useAuthHandlers({
    user,
    users,
    setUser,
    setUsers,
    setAuthError,
    authInitCompleteRef,
    setEmployeeData,
    setCachedModules  // Pass the function to set cached modules
  });

  // Subscribe to Supabase auth changes
  useSupabaseAuth({
    handleUserAuthentication,
    setAuthError,
    authInitCompleteRef
  });

  // Force logout on protected routes when unauthenticated
  useEffect(() => {
    const isAuthPath = location.pathname === '/login' || 
                     location.pathname === '/register' ||
                     location.pathname === '/';
    
    // Check if user is not authenticated on a protected route
    if (!isLoading && !user && !isAuthPath) {
      // Redirect to login page via logout which handles the redirect
      logout();
    }
  }, [user, location.pathname, isLoading]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSaasOwner,
    isAdmin,
    modulePermissions,
    authError,
    employeeData,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changeUserPassword,
    cachedBackofficeModules,
    cachedClientModules
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
