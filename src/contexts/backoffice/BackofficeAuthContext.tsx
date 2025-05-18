
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { BackofficeUser, BackofficeAuthContextType } from './types';
import { logoutBackofficeUser } from '@/services/backoffice/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Session storage key constants
const BACKOFFICE_USER_KEY = 'backoffice_user';

// Extended context type to include setUser
interface ExtendedBackofficeAuthContextType extends BackofficeAuthContextType {
  setUser: React.Dispatch<React.SetStateAction<BackofficeUser | null>>;
  isInitializing: boolean; // Add initialization flag
}

// Create the context
const BackofficeAuthContext = createContext<ExtendedBackofficeAuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
  setUser: () => {},
  isInitializing: true, // Default to initializing
});

export const useBackofficeAuth = () => {
  const context = useContext(BackofficeAuthContext);
  if (!context) {
    throw new Error('useBackofficeAuth must be used within a BackofficeAuthProvider');
  }
  return context;
};

interface BackofficeAuthProviderProps {
  children: React.ReactNode;
}

export const BackofficeAuthProvider: React.FC<BackofficeAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<BackofficeUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Load user from sessionStorage on mount - runs only once
  useEffect(() => {
    console.log("BackofficeAuthProvider: Initializing auth state");
    try {
      const storedUser = sessionStorage.getItem(BACKOFFICE_USER_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("BackofficeAuthProvider: Loaded user from sessionStorage", parsedUser);
          setUser(parsedUser);
        } catch (parseError) {
          console.error("Error parsing user from sessionStorage:", parseError);
          sessionStorage.removeItem(BACKOFFICE_USER_KEY);
        }
      } else {
        console.log("BackofficeAuthProvider: No user in sessionStorage");
      }
    } catch (error) {
      console.error("Error accessing sessionStorage:", error);
    } finally {
      // Mark initialization as complete
      setIsInitializing(false);
    }
  }, []);

  // Memoize the setUser function to update sessionStorage
  const handleSetUser = useCallback((value: React.SetStateAction<BackofficeUser | null>) => {
    setUser(prevUser => {
      // Handle both function and direct value updates
      const newUser = typeof value === 'function' ? value(prevUser) : value;
      
      // Update sessionStorage based on new user value
      if (newUser) {
        console.log("BackofficeAuthProvider: Saving user to sessionStorage", newUser);
        sessionStorage.setItem(BACKOFFICE_USER_KEY, JSON.stringify(newUser));
      } else {
        console.log("BackofficeAuthProvider: Removing user from sessionStorage");
        sessionStorage.removeItem(BACKOFFICE_USER_KEY);
      }
      
      return newUser;
    });
  }, []);

  // Login function stub - actual implementation moved to BackofficeLogin
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("⚠️ BackofficeAuthProvider.login: This function is now just a stub. Actual implementation moved to BackofficeLogin");
    return false;
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutBackofficeUser();
      
      // Clear user from context
      handleSetUser(null);
      
      // Navigate to login page
      navigate('/backoffice/login');
      toast.info("You have been logged out");
    } catch (err) {
      console.error("Backoffice logout error:", err);
      setError('An error occurred during logout');
      toast.error('An error occurred during logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
    clearError,
    setUser: handleSetUser, // Use the memoized handler
    isInitializing
  };

  console.log("BackofficeAuthProvider: Providing context with value:", { 
    hasUser: !!user, 
    isLoading, 
    hasError: !!error,
    isInitializing,
    userData: user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user'
  });

  return (
    <BackofficeAuthContext.Provider value={value}>
      {children}
    </BackofficeAuthContext.Provider>
  );
};
