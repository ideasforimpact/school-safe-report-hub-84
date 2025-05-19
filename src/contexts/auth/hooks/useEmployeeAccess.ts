
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { EmploymentStatus } from '@/contexts/employee/types';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';

/**
 * Hook to check if employee is verified and active
 */
export const useEmployeeAccess = () => {
  const { user } = useAuth();
  const { employees } = useEmployeeVerification();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);

  // Find employee associated with current user
  const employee = useMemo(() => {
    if (!user) return null;
    
    // First check Redux for employee data
    if (employeeData) {
      console.log("Using employee data from Redux:", employeeData);
      // Find the full employee record from the employees list
      const fullEmployee = employees.find(emp => emp.id === employeeData.id);
      if (fullEmployee) {
        return fullEmployee;
      }
      // If we couldn't find the full employee record, still use the Redux data
      return {
        ...employeeData,
        status: true // Assume active if in Redux
      };
    }
    
    // Fallback to finding by email
    return employees.find(emp => emp.email.toLowerCase() === user.email?.toLowerCase());
  }, [user, employees, employeeData]);

  // Check if employee is active
  const isActiveEmployee = useMemo(() => {
    if (!employee) return false;
    
    // Handle both boolean and string status formats
    if (typeof employee.status === 'boolean') {
      return employee.status === true;
    }
    
    // If status is a string, check if it's 'active'
    return employee.status === 'active'; 
  }, [employee]);

  // Check if employee is verified
  const isVerifiedEmployee = useMemo(() => {
    if (!employee) return false;
    
    // Handle both boolean and string status formats
    if (typeof employee.status === 'boolean') {
      return employee.status === true;
    }
    
    // If status is a string, check if it's 'active'
    return employee.status === 'active';
  }, [employee]);

  // Get employee id if available
  const getEmployeeId = useCallback(() => {
    // First try to get from Redux
    if (employeeData?.id) {
      console.log("Getting employee ID from Redux:", employeeData.id);
      return employeeData.id;
    }
    // Fall back to employee object
    const id = employee?.id || null;
    console.log("Getting employee ID from employee object:", id);
    return id;
  }, [employee, employeeData]);

  // Get client id if available
  const getClientId = useCallback(() => {
    // First try to get from Redux
    if (employeeData?.clientId) {
      console.log("Getting client ID from Redux:", employeeData.clientId);
      return employeeData.clientId;
    }
    // Fall back to employee object if it has clientId property
    return (employee as any)?.clientId || null;
  }, [employee, employeeData]);

  return {
    employee,
    isActiveEmployee,
    isVerifiedEmployee,
    getEmployeeId,
    getClientId
  };
};
