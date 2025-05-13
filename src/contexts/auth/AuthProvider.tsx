
import React, { createContext, ReactNode, useEffect, useRef } from 'react';
import { User, UserWithPassword, AuthContextType } from './types';
import { useClient } from '../ClientContext';
import { useAuthState } from './hooks/useAuthState';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { saveUsersToStorage } from '@/services/auth/authService';
import { excludePasswordFromUsers } from './utils';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Get auth state from custom hook
  const { 
    user, 
    setUser, 
    users, 
    setUsers, 
    authError, 
    setAuthError, 
    isAuthInitialized, 
    setIsAuthInitialized,
    authInitCompleteRef
  } = useAuthState();
  
  // Track if we've already logged users
  const hasLoggedUsersRef = useRef(false);
  
  // Get client context to validate domains
  const { isEmailDomainAllowed } = useClient();

  // Get auth handlers
  const { 
    login, 
    logout,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changeUserPassword,
    handleUserAuthentication
  } = useAuthHandlers({
    user,
    users,
    setUser,
    setUsers,
    setAuthError,
    authInitCompleteRef,
    isEmailDomainAllowed
  });

  // Set up Supabase auth - only once per component lifecycle
  const supabaseAuth = useSupabaseAuth({
    users,
    setUser,
    setAuthError,
    setIsAuthInitialized,
    authInitCompleteRef,
    handleUserAuthentication
  });

  // Save users to localStorage whenever they change
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  // Debug: Log current users only once after initialization
  useEffect(() => {
    if (isAuthInitialized && !hasLoggedUsersRef.current) {
      console.log("Current users in AuthContext:", users);
      hasLoggedUsersRef.current = true;
    }
  }, [isAuthInitialized, users]);

  const isAdmin = user?.role === 'admin' || user?.role === 'saas_owner';
  const isSaasOwner = user?.role === 'saas_owner';

  // Expose only user objects without passwords
  const usersWithoutPasswords = excludePasswordFromUsers(users);

  return (
    <AuthContext.Provider value={{ 
      user, 
      users: usersWithoutPasswords, 
      login, 
      logout: supabaseAuth.logout, // Use the logout from supabaseAuth
      isAdmin,
      isSaasOwner,
      addUser,
      updateUser,
      deleteUser,
      deactivateUser,
      reactivateUser,
      changePassword: changeUserPassword,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
