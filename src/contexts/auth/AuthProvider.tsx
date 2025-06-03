import React, { createContext, useEffect, useState } from 'react';
import { useAuthState } from './hooks/useAuthState';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useEmployeeAccess } from './hooks/useEmployeeAccess';
import { User, AuthContextType } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData } from '@/store/employeeSlice';
import { toast } from 'sonner';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isSaasOwner,
    setIsSaasOwner,
  } = useAuthState();

  const { dispatch } = useEmployeeStore();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useSupabaseAuth({ setUser, setIsLoading, setIsSaasOwner });
  const { employeeData } = useEmployeeAccess({ user, dispatch, setEmployeeData });
  const { login, logout } = useAuthHandlers({ 
    setUser, 
    setIsLoading, 
    setIsSaasOwner,
    dispatch,
    setEmployeeData
  });

  // Remove the welcome toast effect
  useEffect(() => {
    if (user && !hasShownWelcome) {
      setHasShownWelcome(true);
      // Removed the welcome toast message
    }
  }, [user, hasShownWelcome]);

  const contextValue: AuthContextType = {
    user,
    employeeData,
    isLoading,
    login,
    logout,
    isSaasOwner,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
