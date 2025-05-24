
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthContextType, EmployeeData, User } from './types';

interface UserRole {
  id: string;
  name: string;
}

interface ModulePermissions {
  moduleName: string;
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

interface EmployeeType {
  id: string;
  name: string;
}

interface DepartmentType {
  id: string;
  name: string;
}

// Create the context with a default value of null
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        await fetchEmployeeData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        await fetchEmployeeData(session.user.id);
      } else {
        setSupabaseUser(null);
        setEmployeeData(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('employees')
        .select(`
          id, first_name, last_name, email, employee_id, status,
          employee_type, department, client_id, is_super_admin
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching employee data:', error);
        toast.error('Failed to load employee data');
        return;
      }

      if (profile) {
        const employeeData: EmployeeData = {
          id: profile.id,
          clientId: profile.client_id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          isSuperAdmin: profile.is_super_admin,
          department: profile.department,
          employeeType: profile.employee_type
        };

        setEmployeeData(employeeData);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching employee data:', error);
      toast.error('Unexpected error loading employee data: ' + error.message);
    }
  };

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success('Check your email for the sign-in link!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error('Error signing in: ' + error.message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setSupabaseUser(null);
      setEmployeeData(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Error signing out: ' + error.message);
    }
  };

  const updateEmployeeData = (newData: Partial<EmployeeData>) => {
    setEmployeeData(prev => prev ? { ...prev, ...newData } : null);
  };

  // Create a custom User object that matches our User type
  const user: User | null = supabaseUser ? {
    id: supabaseUser.id,
    firstName: employeeData?.firstName || '',
    lastName: employeeData?.lastName || '',
    email: supabaseUser.email || '',
    role: 'user',
    isActive: true,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
    provider: 'email',
    clientId: employeeData?.clientId || null,
    employeeId: '',
    employeeType: 'permanent',
    department: 'Other',
    joiningDate: '',
    isSuperAdmin: employeeData?.isSuperAdmin || false
  } : null;

  // Placeholder functions to match AuthContextType interface
  const users: any[] = [];
  const login = async (email: string, password: string): Promise<boolean> => {
    return false;
  };
  const logout = () => {};
  const isAdmin = false;
  const isSaasOwner = false;
  const addUser = (userData: any) => {};
  const updateUser = (id: string, updates: Partial<any>) => {};
  const deleteUser = (id: string) => {};
  const deactivateUser = (id: string) => {};
  const reactivateUser = (id: string) => {};
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    return false;
  };
  const authError: string | null = null;
  const handleUserAuthentication = async (supabaseUser: any): Promise<void> => {};

  const value: AuthContextType = {
    user,
    users,
    login,
    logout,
    isAdmin,
    isSaasOwner,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changePassword,
    authError,
    handleUserAuthentication,
    employeeData,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    updateEmployeeData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
