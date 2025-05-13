
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Employee } from '@/types/employeeVerification';
import { initialEmployees } from '../initialData';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  // Fetch employees from the database
  const fetchEmployees = useCallback(async () => {
    try {
      // Attempt to fetch employees from the database
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      // Map the database employees to our Employee type
      if (data && data.length > 0) {
        const mappedEmployees = data.map((emp): Employee => ({
          id: emp.id,
          employeeId: emp.employee_id || '',
          name: `${emp.first_name} ${emp.last_name}`,
          email: emp.email || '',
          // Use default values for fields that don't exist in the database
          phone: '',
          dateOfBirth: '',
          address: '',
          joiningDate: emp.joining_date || new Date().toISOString(),
          department: emp.department || '',
          position: emp.employee_type || '', // Use employee_type as position since it doesn't exist
          employeeType: (emp.employee_type as Employee['employeeType']) || 'permanent',
          status: emp.status === 'verified' ? 'verified' : 
                 emp.status === 'failed' ? 'failed' : 'pending', // Map status to our verification status
          createdAt: emp.created_at || new Date().toISOString(),
          updatedAt: emp.updated_at || new Date().toISOString(),
        }));
        
        setEmployees(mappedEmployees);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, []);

  // Call fetchEmployees initially
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    setEmployees([...employees, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
    ));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    fetchEmployees
  };
};
