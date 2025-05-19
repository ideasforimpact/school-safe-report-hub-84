
import React, { createContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from './types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { INITIAL_MOCK_USERS } from './initialData';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isSaasOwner: false,
  isLoading: true,
  users: [],
  authError: null,
  login: async () => false, // Changed to return boolean
  logout: async () => {},
  getRequiredPermission: () => '',
  registerUser: async () => {},
  updateUserInfo: async () => {},
  googleSignIn: async () => {},
  resetPassword: async () => {},
  changePassword: async () => false, // Changed to return boolean
  addUser: async () => {},
  handleUserAuthentication: async () => {}, // Added this
});

// Auth Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // State for the current user
  const [user, setUser] = useLocalStorage<User | null>('currentUser', null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useLocalStorage('users', INITIAL_MOCK_USERS);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Use a ref to keep track of whether auth initialization has completed
  const authInitCompleteRef = useRef(false);
  
  // Helper function to check if an email domain is allowed for a given client
  const isEmailDomainAllowed = (email: string, clientId: string) => {
    // This is a placeholder function - in a full implementation,
    // we would check against domain restrictions from the client's settings
    // For now, we allow all emails
    return true;
  };
  
  // Use hooks to manage auth operations
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
    isEmailDomainAllowed,
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'saas_owner';
  const isSaasOwner = user?.role === 'saas_owner';

  // Registers a new user
  const registerUser = async (userData: Omit<User & { password: string }, 'id'>) => {
    // Skip employee check for direct registrations since this is creating a new account
    try {
      await addUser(userData);
      // After registration is complete, log the user in
      await login(userData.email, userData.password);
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  };

  // Updates user information
  const updateUserInfo = async (userId: string, userData: Partial<User>) => {
    await updateUser(userId, userData);
    return Promise.resolve();
  };

  // Initialize Supabase auth state listener
  useEffect(() => {
    console.info("🔵 Setting up Supabase auth state listener");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", _event, session?.user?.email);
        
        if (session) {
          // User is logged in
          try {
            await handleUserAuthentication(session.user);
          } catch (error) {
            console.error("Error handling auth state change:", error);
            setAuthError("Authentication error");
          }
        } else {
          // User is logged out
          setUser(null);
        }
      }
    );

    // Check the initial session
    console.info("🔍 Checking initial Supabase auth session");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is already logged in
        handleUserAuthentication(session.user).catch(err => {
          console.error("Error handling initial session:", err);
          setAuthError("Session initialization error");
        });
      } else {
        console.info("ℹ️ No existing session found");
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.info("🧹 Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  // Method to sign in with Google
  const googleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        setAuthError(error.message);
        toast.error("Google sign-in failed");
        throw error;
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError("Google sign-in failed");
      toast.error("Google sign-in failed");
      throw error;
    }
  };

  // Method to reset password - sends reset email
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setAuthError(error.message);
        toast.error("Failed to send password reset email");
        throw error;
      }
      
      toast.success("Password reset email sent. Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      setAuthError("Failed to send password reset email");
      toast.error("Failed to send password reset email");
      throw error;
    }
  };

  // Function to get required permission for a module
  const getRequiredPermission = (module: string): string => {
    // Simple mapping function - this could be expanded with more logic
    const modulePermissionMap: Record<string, string> = {
      'incidents': 'incidentReporting',
      'incident-management': 'incidentAdmin',
      'assessments': 'assessmentUser',
      'assessments-admin': 'assessmentsAdmin',
      'employee-verification': 'employeeVerificationAdmin',
      'grievances': 'grievancesAdmin',
      'transport-safety': 'transportSafetyAdmin',
      'edusafe-resources': 'eduSafeResourceAccess',
    };
    
    return modulePermissionMap[module] || '';
  };

  // Combine all values and functions to provide through the context
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isSaasOwner,
    isLoading,
    users,
    authError,
    login,
    logout,
    getRequiredPermission,
    registerUser,
    updateUserInfo,
    googleSignIn,
    resetPassword,
    changePassword: changeUserPassword,
    addUser,
    handleUserAuthentication, // Add this
  };

  // Render the AuthContext.Provider with the context value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
