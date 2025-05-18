
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
        console.log("BackofficeAuthProvider: Checking existing session");
        const storedUser = sessionStorage.getItem('backoffice_user');
        if (storedUser) {
          console.log("BackofficeAuthProvider: Found stored user in session");
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          console.log("BackofficeAuthProvider: No user found in session");
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
    console.log("🔐 BackofficeAuthProvider.login CALLED with email:", email);
    setIsLoading(true);
    setError(null);

    try {
      // Call the service to authenticate the user
      console.log("🔐 BackofficeAuthProvider.login: Calling loginBackofficeUser service function");
      const backofficeUser = await loginBackofficeUser(email, password);
      console.log("🔐 BackofficeAuthProvider.login: loginBackofficeUser returned:", backofficeUser ? "User object received" : "Failed - No user returned");
      
      if (backofficeUser) {
        console.log("🔐 BackofficeAuthProvider.login: Setting user and session storage");
        setUser(backofficeUser);
        // Store user in session storage
        sessionStorage.setItem('backoffice_user', JSON.stringify(backofficeUser));
        toast.success("Login successful!");
        console.log("🔐 BackofficeAuthProvider.login: Returning true");
        return true;
      } else {
        console.log("🔐 BackofficeAuthProvider.login: Login failed, no user returned");
        setError('Invalid email or password');
        toast.error('Invalid email or password');
        return false;
      }
    } catch (err) {
      console.error("🔐 BackofficeAuthProvider.login: Login error:", err);
      setError('An error occurred during login');
      toast.error('An error occurred during login');
      return false;
    } finally {
      console.log("🔐 BackofficeAuthProvider.login: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
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

  console.log("BackofficeAuthProvider: Providing context with value:", { 
    hasUser: !!user, 
    isLoading, 
    hasError: !!error 
  });

  return (
    <BackofficeAuthContext.Provider value={value}>
      {children}
    </BackofficeAuthContext.Provider>
  );
};
