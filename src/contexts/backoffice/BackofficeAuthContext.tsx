
import React, { createContext, useState, useEffect, useContext } from 'react';
import { BackofficeUser, BackofficeAuthContextType } from './types';
import { logoutBackofficeUser } from '@/services/backoffice/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Session storage key constants
const BACKOFFICE_USER_KEY = 'backoffice_user';

// Extended context type to include setUser
interface ExtendedBackofficeAuthContextType extends BackofficeAuthContextType {
  setUser: React.Dispatch<React.SetStateAction<BackofficeUser | null>>;
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
  const navigate = useNavigate();

  // Effect to load user from sessionStorage on mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(BACKOFFICE_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("BackofficeAuthProvider: Loaded user from sessionStorage", parsedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user from sessionStorage:", error);
    }
  }, []);

  // Effect to update sessionStorage when user changes
  useEffect(() => {
    if (user) {
      console.log("BackofficeAuthProvider: Saving user to sessionStorage", user);
      sessionStorage.setItem(BACKOFFICE_USER_KEY, JSON.stringify(user));
    } else {
      console.log("BackofficeAuthProvider: Removing user from sessionStorage");
      sessionStorage.removeItem(BACKOFFICE_USER_KEY);
    }
  }, [user]);

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
      setUser(null);
      // Remove from sessionStorage
      sessionStorage.removeItem(BACKOFFICE_USER_KEY);
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
    setUser
  };

  console.log("BackofficeAuthProvider: Providing context with value:", { 
    hasUser: !!user, 
    isLoading, 
    hasError: !!error,
    userData: user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user'
  });

  return (
    <BackofficeAuthContext.Provider value={value}>
      {children}
    </BackofficeAuthContext.Provider>
  );
};
