
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
        return initialEmployees;
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
        return mappedEmployees;
      }
      
      return initialEmployees;
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      return initialEmployees;
    }
  }, []);

  // Call fetchEmployees initially
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newEmployee: Employee = {
        ...employeeData,
        id: uuidv4(),
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      setEmployees([...employees, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    try {
      const employeeToUpdate = employees.find(emp => emp.id === id);
      
      if (!employeeToUpdate) {
        throw new Error(`Employee with id ${id} not found`);
      }
      
      const updatedEmployee = { 
        ...employeeToUpdate, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      setEmployees(employees.map(emp => 
        emp.id === id ? updatedEmployee : emp
      ));
      
      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const employeeExists = employees.some(emp => emp.id === id);
      
      if (!employeeExists) {
        return false;
      }
      
      setEmployees(employees.filter(emp => emp.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
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
