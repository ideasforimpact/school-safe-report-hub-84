
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

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchEmployeeData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchEmployeeData(session.user.id);
      } else {
        setUser(null);
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
          id, first_name, last_name, email, employee_id, 
          employee_type, department, status,
          client_id, is_super_admin
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
          phone: '',
          employeeId: profile.employee_id,
          position: '',
          employeeTypeId: '',
          employeeType: { id: '', name: profile.employee_type },
          departmentId: '',
          department: { id: '', name: profile.department },
          userRoleId: '',
          userRole: { id: '', name: '' },
          modulePermissions: [],
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

  const value: AuthContextType = {
    user,
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
