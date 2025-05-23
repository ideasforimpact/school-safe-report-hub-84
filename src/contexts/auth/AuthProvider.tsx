import React, { createContext, useState, useEffect, useContext, useReducer } from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types';
import { useClient } from '../ClientContext';

// Define the types for the context
interface AuthContextProps {
  user: User | null;
  employeeData: Employee | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: any) => Promise<any>;
  signIn: (data: any) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updateUser: (data: any) => Promise<any>;
}

// Create the context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { client } = useClient();
  const initialState = {
    userData: null,
  };

  const reducer = (state: any, action: any) => {
    switch (action.type) {
      case 'SET_USER_DATA':
        return { ...state, userData: action.payload };
      case 'CLEAR_USER_DATA':
        return { ...state, userData: null };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // Set auth status on page load
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      setUser(session?.user ?? null);
    };

    getSession();

    supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setSession(session);
      }
    );
  }, []);

  useEffect(() => {
    // Fetch employee data if user and client are available
    const fetchEmployeeData = async () => {
      if (user?.id && client?.id) {
        setLoading(true);
        try {
          const { data: employee, error } = await supabase
            .from('employees')
            .select('*')
            .eq('auth_id', user.id)
            .eq('client_id', client.id)
            .single();

          if (error) {
            console.error('Error fetching employee data:', error);
          } else {
            setEmployeeData(employee);
            // Store user data in Redux store
            dispatch({ type: 'SET_USER_DATA', payload: employee });
          }
        } catch (error) {
          console.error('Unexpected error fetching employee data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setEmployeeData(null);
      }
    };

    fetchEmployeeData();
  }, [user?.id, client?.id]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Clear the user data from Redux store
      dispatch({ type: 'CLEAR_USER_DATA' }); // Fix: pass object with type property
      setUser(null);
      setEmployeeData(null);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
      }
      console.log('User signed in successfully');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error signing in:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: any) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      });

      if (authError) {
        console.error('Error signing up:', authError.message);
        return { success: false, error: authError.message };
      }

      // Create employee profile in the employees table
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert([
          {
            auth_id: authData.user?.id,
            client_id: client?.id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
          },
        ])
        .select()

      if (employeeError) {
        console.error('Error creating employee profile:', employeeError);
        // Optionally, delete the user from auth if employee creation fails
        await supabase.auth.admin.deleteUser(authData.user?.id || '');
        return { success: false, error: 'Failed to create employee profile' };
      }

      console.log('User signed up and employee profile created successfully');
      return { success: true, authData, employee };
    } catch (error) {
      console.error('Unexpected error signing up:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        console.error('Error resetting password:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Password reset email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error resetting password:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (data: any) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: data.password,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      if (authError) {
        console.error('Error updating user:', authError.message);
        return { success: false, error: authError.message };
      }

      // Update employee profile in the employees table
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
        })
        .eq('auth_id', user?.id);

      if (employeeError) {
        console.error('Error updating employee profile:', employeeError);
        return { success: false, error: 'Failed to update employee profile' };
      }

      console.log('User updated successfully');

      // Clear Redux store on sign out
      dispatch({ type: 'CLEAR_USER_DATA' }); // Fix: pass object with type property
      setUser(null);
      setEmployeeData(null);
      console.log('User session ended, cleared user data');

      return { success: true, authData };
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextProps = {
    user,
    employeeData,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateUser: handleUpdateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
