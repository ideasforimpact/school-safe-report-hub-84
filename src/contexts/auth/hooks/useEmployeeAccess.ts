import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { User, ModulePermissions } from '@/contexts/auth/types';
import { Employee } from '@/contexts/employee/types';
import { EmploymentStatus } from '@/contexts/employee/types';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

/**
 * Hook to check if employee is verified and active
 */
export const useEmployeeAccess = () => {
  const { user } = useAuth();
  const { employees } = useEmployeeVerification();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

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
        status: true, // Assume active if in Redux
        isAdmin, // Add isAdmin from Redux
        isSuperAdmin // Add isSuperAdmin from Redux
      };
    }
    
    // Fallback to finding by email
    return employees.find(emp => emp.email.toLowerCase() === user.email?.toLowerCase());
  }, [user, employees, employeeData, isAdmin, isSuperAdmin]);

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
    // Only get from Redux, no fallback
    if (employeeData?.id) {
      console.log("Getting employee ID from Redux:", employeeData.id);
      return employeeData.id;
    }
    return null;
  }, [employeeData]);

  // Get client id if available
  const getClientId = useCallback(() => {
    // Only get from Redux, no fallback
    if (employeeData?.clientId) {
      console.log("Getting client ID from Redux:", employeeData.clientId);
      return employeeData.clientId;
    }
    return null;
  }, [employeeData]);

  return {
    employee,
    isActiveEmployee,
    isVerifiedEmployee,
    getEmployeeId,
    getClientId,
    isAdmin,
    isSuperAdmin
  };
};
