
import React, { createContext, useState, useEffect, useContext } from 'react';
import { BackofficeUser, BackofficeAuthContextType } from './types';
import { loginBackofficeUser, logoutBackofficeUser } from '@/services/backoffice/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Create the context
const BackofficeAuthContext = createContext<BackofficeAuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
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

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        console.log("Checking for existing backoffice session");
        // Check if there's a stored backoffice user
        const storedUser = sessionStorage.getItem('backoffice_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Found stored backoffice user:", parsedUser.email);
          setUser(parsedUser);
        } else {
          console.log("No stored backoffice user found");
        }
      } catch (err) {
        console.error("Error checking backoffice session:", err);
        // If there's an error parsing, clear the session
        sessionStorage.removeItem('backoffice_user');
      }
    };

    checkExistingSession();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting backoffice login with email:", email);
      // Check if this is a demo login
      const isDemoUser = email === 'owner@saasplatform.com' && password === 'owner123';
      if (isDemoUser) {
        console.log("Using demo credentials for login");
      }
      
      const backofficeUser = await loginBackofficeUser(email, password);
      
      if (backofficeUser) {
        console.log("Backoffice login successful for:", backofficeUser.email);
        setUser(backofficeUser);
        // Store user in session storage
        sessionStorage.setItem('backoffice_user', JSON.stringify(backofficeUser));
        toast.success("Login successful!");
        return true;
      } else {
        console.error("Backoffice login failed - invalid credentials or user not found");
        setError('Invalid email or password');
        toast.error('Invalid email or password');
        return false;
      }
    } catch (err) {
      console.error("Backoffice login error:", err);
      setError('An error occurred during login');
      toast.error('An error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Logging out backoffice user");
      await logoutBackofficeUser();
      setUser(null);
      // Clear session storage
      sessionStorage.removeItem('backoffice_user');
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
    clearError
  };

  return (
    <BackofficeAuthContext.Provider value={value}>
      {children}
    </BackofficeAuthContext.Provider>
  );
};
