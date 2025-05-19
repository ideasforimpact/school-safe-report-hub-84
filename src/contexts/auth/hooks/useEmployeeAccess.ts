import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeVerification } from '@/contexts/employee-verification';

/**
 * Hook to check if employee is verified and active
 */
export const useEmployeeAccess = () => {
  const { user } = useAuth();
  const { employees } = useEmployeeVerification();

  // Find employee associated with current user
  const employee = useMemo(() => {
    if (!user) return null;
    
    return employees.find(emp => emp.email.toLowerCase() === user.email?.toLowerCase());
  }, [user, employees]);

  // Check if employee is active
  const isActiveEmployee = useMemo(() => {
    if (!employee) return false;
    return employee.status === true; // Using boolean status
  }, [employee]);

  // Check if employee is verified
  const isVerifiedEmployee = useMemo(() => {
    if (!employee) return false;
    return employee.status === true; // Using boolean status
  }, [employee]);

  // Get employee id if available
  const getEmployeeId = useCallback(() => {
    return employee?.id || null;
  }, [employee]);

  return {
    employee,
    isActiveEmployee,
    isVerifiedEmployee,
    getEmployeeId
  };
};

// Helper function to fetch module information for an employee
export const fetchEmployeeModules = async (clientId: string, email: string) => {
  try {
    console.log(`Fetching modules for client ${clientId} and employee ${email}`);
    
    // 1. Get module IDs and access levels from client_modules
    const { data: clientModules, error: clientModulesError } = await supabase
      .from('client_modules')
      .select('module_id, access_level')
      .eq('client_id', clientId);
      
    if (clientModulesError) {
      console.error('Error fetching client modules:', clientModulesError);
      return [];
    }
    
    if (!clientModules || clientModules.length === 0) {
      console.log('No modules assigned to this client');
      return [];
    }
    
    console.log(`Found ${clientModules.length} modules for client ${clientId}`);
    
    // 2. Get full module details from modules table
    const moduleIds = clientModules.map(cm => cm.module_id);
    const { data: moduleDetails, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .in('id', moduleIds);
      
    if (modulesError) {
      console.error('Error fetching module details:', modulesError);
      return [];
    }
    
    if (!moduleDetails || moduleDetails.length === 0) {
      console.log('No module details found');
      return [];
    }
    
    // 3. Combine module details with access levels
    const modulesWithAccess = moduleDetails.map(module => {
      // Find matching client_module to get access_level
      const clientModule = clientModules.find(cm => cm.module_id === module.id);
      return {
        ...module,
        access_level: clientModule?.access_level || {
          isEnabled: true
        }
      };
    });
    
    console.log('Processed modules with access levels:', modulesWithAccess);
    return modulesWithAccess;
    
  } catch (error) {
    console.error('Error in fetchEmployeeModules:', error);
    return [];
  }
};
