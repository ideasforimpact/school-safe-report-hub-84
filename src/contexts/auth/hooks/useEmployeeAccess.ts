
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { EmploymentStatus } from '@/contexts/employee/types';

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
    
    // Handle both boolean and string status formats
    if (typeof employee.status === 'boolean') {
      return employee.status === true;
    }
    
    return employee.status === 'active'; // Using EmploymentStatus
  }, [employee]);

  // Check if employee is verified
  const isVerifiedEmployee = useMemo(() => {
    if (!employee) return false;
    
    // Handle both boolean and string status formats
    if (typeof employee.status === 'boolean') {
      return employee.status === true;
    }
    
    return employee.status === 'active'; // Using EmploymentStatus
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
