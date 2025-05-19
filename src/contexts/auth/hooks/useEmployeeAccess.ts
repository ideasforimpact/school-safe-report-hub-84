import { useCallback, useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { EmploymentStatus, EmployeeData, DepartmentType, EmployeeType } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if employee is verified and active
 */
export const useEmployeeAccess = () => {
  const { user, employeeData } = useAuth();
  const { employees } = useEmployeeVerification();
  const [fetchedEmployeeData, setFetchedEmployeeData] = useState<EmployeeData | null>(null);

  // Fetch employee data directly from DB if needed
  useEffect(() => {
    const fetchEmployeeIfNeeded = async () => {
      // Only fetch if we have a user but no employee data
      if (user?.email && !employeeData && !fetchedEmployeeData) {
        console.log("Employee Access: Fetching employee data for", user.email);
        
        try {
          const { data, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type, status, employee_id')
            .eq('email', user.email.toLowerCase())
            .single();
          
          if (data && !error) {
            console.log("Employee Access: Found employee data:", data);
            
            const employee: EmployeeData = {
              id: data.id,
              clientId: data.client_id,
              email: data.email,
              firstName: data.first_name,
              lastName: data.last_name,
              isSuperAdmin: data.is_super_admin,
              department: data.department as DepartmentType, // Fix: Explicit type casting
              employeeType: data.employee_type as EmployeeType, // Fix: Explicit type casting
              status: data.status,
              employeeId: data.employee_id
            };
            
            setFetchedEmployeeData(employee);
            console.log("Employee Access: Set fetched employee data:", employee);
          } else {
            console.log("Employee Access: No employee data found or error:", error);
          }
        } catch (err) {
          console.error("Employee Access: Error fetching employee data:", err);
        }
      }
    };
    
    fetchEmployeeIfNeeded();
  }, [user, employeeData, fetchedEmployeeData]);

  // Find employee associated with current user
  const employee = useMemo(() => {
    if (!user) return null;
    
    // First check context for employee data
    if (employeeData) {
      console.log("Using employee data from context:", employeeData);
      // Find the full employee record from the employees list
      const fullEmployee = employees.find(emp => emp.id === employeeData.id);
      if (fullEmployee) {
        return fullEmployee;
      }
      // If we couldn't find the full employee record, still use the context data
      return {
        ...employeeData,
        status: true // Assume active if in context
      };
    }
    
    // Next check if we fetched it directly
    if (fetchedEmployeeData) {
      console.log("Using employee data from direct fetch:", fetchedEmployeeData);
      return {
        ...fetchedEmployeeData,
        status: true // Assume active if we fetched it
      };
    }
    
    // Fallback to finding by email
    console.log("Falling back to finding employee by email:", user.email);
    return employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
  }, [user, employees, employeeData, fetchedEmployeeData]);

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
    // First try to get from context
    if (employeeData?.id) {
      console.log("Getting employee ID from context:", employeeData.id);
      return employeeData.id;
    }
    
    // Then try from directly fetched data
    if (fetchedEmployeeData?.id) {
      console.log("Getting employee ID from fetched data:", fetchedEmployeeData.id);
      return fetchedEmployeeData.id;
    }
    
    // Fall back to employee object
    const id = employee?.id || null;
    console.log("Getting employee ID from employee object:", id);
    return id;
  }, [employee, employeeData, fetchedEmployeeData]);

  // Get client id if available
  const getClientId = useCallback(() => {
    // First try to get from context
    if (employeeData?.clientId) {
      console.log("Getting client ID from context:", employeeData.clientId);
      return employeeData.clientId;
    }
    
    // Then try from directly fetched data
    if (fetchedEmployeeData?.clientId) {
      console.log("Getting client ID from fetched data:", fetchedEmployeeData.clientId);
      return fetchedEmployeeData.clientId;
    }
    
    // Fall back to employee object
    if (employee) {
      const clientId = (employee as any)?.clientId || (employee as any)?.client_id || null;
      console.log("Getting client ID from employee object:", clientId);
      return clientId;
    }
    
    return null;
  }, [employee, employeeData, fetchedEmployeeData]);

  return {
    employee: employee || fetchedEmployeeData || null,
    isActiveEmployee,
    isVerifiedEmployee,
    getEmployeeId,
    getClientId,
    fetchedEmployeeData
  };
};
