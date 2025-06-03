
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { getEmployeeByUserIdFromApi } from '@/services/employee/employeeRetrievalService';
import { EmployeeData } from '../types';
import { useLocation } from 'react-router-dom';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchEmployeeData = async (userId: string) => {
    try {
      const employee = await getEmployeeByUserIdFromApi(userId, location.pathname);
      
      if (employee) {
        const employeeData: EmployeeData = {
          id: employee.id,
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          clientId: employee.clientId || '',
          isSuperAdmin: employee.isSuperAdmin || false
        };
        
        setEmployeeData(employeeData);
      } else {
        setEmployeeData(null);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setEmployeeData(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchEmployeeData(currentUser.id);
      } else {
        setEmployeeData(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchEmployeeData(currentUser.id);
        } else {
          setEmployeeData(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  return {
    user,
    employeeData,
    loading
  };
};
