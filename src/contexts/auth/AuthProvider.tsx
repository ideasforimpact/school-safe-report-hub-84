
import React, { createContext, useState, useEffect, useContext, ReactNode, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User as SupabaseUser,
  Session,
  AuthChangeEvent,
} from '@supabase/supabase-js';

// Import the types from the auth context
import {
  User,
  EmployeeType,
  DepartmentType,
  AuthProviderProps,
  AuthContextType,
  AuthAction,
  AuthState,
} from './types';

// Define the initial state
const initialState: AuthState = {
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer function to manage the authentication state
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isSuperAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_ADMIN':
      return {
        ...state,
        isAdmin: action.payload,
        isLoading: false,
      };
    case 'SET_SUPER_ADMIN':
      return {
        ...state,
        isSuperAdmin: action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // Function to convert Supabase user to your application's user type
  const convertSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;

    // Extract user metadata
    const {
      firstName,
      lastName,
      employeeId,
      employeeType,
      department,
      joiningDate,
      clientId,
      is_super_admin
    } = supabaseUser.user_metadata as {
      firstName?: string;
      lastName?: string;
      employeeId?: string;
      employeeType?: EmployeeType;
      department?: DepartmentType;
      joiningDate?: string;
      clientId?: string;
      is_super_admin?: boolean;
    };

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || 'no-email-provided',
      firstName: firstName || 'No First Name',
      lastName: lastName || 'No Last Name',
      employeeId: employeeId || 'No Employee ID',
      employeeType: (employeeType || 'permanent') as EmployeeType,
      department: (department || 'admin') as DepartmentType,
      joiningDate: joiningDate || 'No Joining Date',
      clientId: clientId || 'No Client ID',
      isSuperAdmin: is_super_admin || false,
      // Add default role property to satisfy User interface
      role: 'user' as const
    };
  };

  // Function to handle user login
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(`Login failed: ${error.message}`);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return false;
      } else {
        // Convert Supabase user to your application's user type
        const user = convertSupabaseUser(data.user);

        if (user) {
          dispatch({ type: 'LOGIN', payload: user });
          toast.success('Login successful!');
          navigate('/dashboard');
          return true;
        }
        return false;
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      toast.error(`Login failed: ${error.message || 'An unexpected error occurred'}`);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unexpected error occurred' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to handle user logout
  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        toast.error(`Logout failed: ${error.message}`);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        // Dispatch logout action to reset the state
        dispatch({ type: 'LOGOUT' });
        toast.success('Logout successful!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Logout exception:', error);
      toast.error(`Logout failed: ${error.message || 'An unexpected error occurred'}`);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unexpected error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to handle password reset request
  const resetPassword = async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(`Password reset failed: ${error.message}`);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        toast.success('Password reset email sent successfully!');
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast.error(`Password reset failed: ${error.message || 'An unexpected error occurred'}`);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unexpected error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to handle updating user password
  const updatePassword = async (newPassword: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Update password error:', error);
        toast.error(`Update password failed: ${error.message}`);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        toast.success('Password updated successfully!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Update password exception:', error);
      toast.error(`Update password failed: ${error.message || 'An unexpected error occurred'}`);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unexpected error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to handle session changes
  const handleSessionChange = async (event: AuthChangeEvent, session: Session | null) => {
    console.log(`Auth event: ${event}`);

    if (session) {
      // Convert Supabase user to your application's user type
      const user = convertSupabaseUser(session.user);

      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
        console.log('Session change - user logged in:', user);
      }
    } else {
      // Dispatch logout action to reset the state
      dispatch({ type: 'LOGOUT' });
      console.log('Session change - user logged out');
    }
  };

  // Function to handle initial authentication check
  const checkInitialAuth = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Initial auth error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }

      if (session) {
        // Convert Supabase user to your application's user type
        const user = convertSupabaseUser(session.user);

        if (user) {
          dispatch({ type: 'LOGIN', payload: user });
          console.log('Initial auth - user logged in:', user);
        }
      } else {
        // Dispatch logout action to reset the state
        dispatch({ type: 'LOGOUT' });
        console.log('Initial auth - no user logged in');
      }
    } catch (error: any) {
      console.error('Initial auth exception:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'An unexpected error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to determine admin status
  const determineAdminStatus = async (user: User | null) => {
    if (!user) {
      dispatch({ type: 'SET_ADMIN', payload: false });
      return;
    }

    try {
      // Check if the user's email ends with '@saasplatform.com'
      const isAdminUser = user && user.email.endsWith('@saasplatform.com');
      dispatch({ type: 'SET_ADMIN', payload: isAdminUser });
    } catch (error) {
      console.error('Error determining admin status:', error);
      dispatch({ type: 'SET_ADMIN', payload: false });
    }
  };

  // Function to determine super admin status
  const determineSuperAdminStatus = async (user: User | null) => {
    if (!user) {
      dispatch({ type: 'SET_SUPER_ADMIN', payload: false });
      return;
    }

    try {
      // Check if the user's isSuperAdmin property is true
      const isSuperAdminUser = user && user.isSuperAdmin === true;
      dispatch({ type: 'SET_SUPER_ADMIN', payload: isSuperAdminUser });
    } catch (error) {
      console.error('Error determining super admin status:', error);
      dispatch({ type: 'SET_SUPER_ADMIN', payload: false });
    }
  };

  // Set up Supabase auth state listener on component mount
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleSessionChange);

    // Perform initial auth check
    checkInitialAuth();

    // Clean up the listener when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Update admin status when the user changes
  useEffect(() => {
    determineAdminStatus(state.user);
    determineSuperAdminStatus(state.user);
  }, [state.user]);

  // Mock methods for user management
  const addUser = (userData: Partial<User>) => {
    console.log('Add user:', userData);
    // Implementation would connect to a backend service
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    console.log('Update user:', id, userData);
    // Implementation would connect to a backend service
  };

  const deleteUser = (id: string) => {
    console.log('Delete user:', id);
    // Implementation would connect to a backend service
  };

  const deactivateUser = (id: string) => {
    console.log('Deactivate user:', id);
    // Implementation would connect to a backend service
  };

  const reactivateUser = (id: string) => {
    console.log('Reactivate user:', id);
    // Implementation would connect to a backend service
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    console.log('Change password');
    // Implementation would connect to a backend service
    return true;
  };

  const handleUserAuthentication = async (userData: any) => {
    console.log('Handle user authentication:', userData);
    // Implementation would connect to a backend service
  };

  // Provide the authentication context value
  const value: AuthContextType = {
    user: state.user,
    users: users,
    isAdmin: state.isAdmin,
    isSaasOwner: state.isSuperAdmin,
    authError: state.error,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changePassword,
    handleUserAuthentication,
    employeeData: null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
