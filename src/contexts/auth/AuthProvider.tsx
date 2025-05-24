
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthContextType, EmployeeData } from './types';

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
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const session = supabase.auth.getSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.session?.user) {
        setUser(session.session.user);
        setIsAuthenticated(true);
        await fetchEmployeeData(session.session.user.id);
      } else {
        setUser(null);
        setEmployeeData(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    if (session?.data?.session?.user) {
      setUser(session.data.session.user);
      setIsAuthenticated(true);
      fetchEmployeeData(session.data.session.user.id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('employees')
        .select(`
          id, first_name, last_name, email, phone, employee_id, position, status,
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
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          employeeId: profile.employee_id,
          position: profile.position,
          employeeType: profile.employee_type,
          department: profile.department,
          clientId: profile.client_id,
          isSuperAdmin: profile.is_super_admin,
          status: profile.status
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
      setUser(null);
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

  // Stub implementations for missing functions
  const login = async (email: string, password: string) => {
    return false;
  };

  const logout = () => {
    signOut();
  };

  const addUser = (userData: any) => {
    // Implementation needed
  };

  const updateUser = (id: string, updates: any) => {
    // Implementation needed
  };

  const deleteUser = (id: string) => {
    // Implementation needed
  };

  const deactivateUser = (id: string) => {
    // Implementation needed
  };

  const reactivateUser = (id: string) => {
    // Implementation needed
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return false;
  };

  const handleUserAuthentication = async (supabaseUser: any) => {
    // Implementation needed
  };

  const value: AuthContextType = {
    user,
    users,
    login,
    logout,
    isAdmin: false,
    isSaasOwner: false,
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
