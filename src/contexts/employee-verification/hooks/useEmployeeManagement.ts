import { useState, useCallback } from 'react';
import { Employee } from '../types';
import { getAllEmployeesFromApi, getEmployeeByIdFromApi } from '@/services/employee/employeeApiService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all employees, optionally filtered by client ID
  const fetchEmployees = useCallback(async (clientId?: string | null) => {
    setIsLoading(true);
    try {
      console.log("Fetching employees with client ID:", clientId);
      const fetchedEmployees = await getAllEmployeesFromApi(clientId);
      setEmployees(fetchedEmployees);
      return fetchedEmployees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get an employee by ID
  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(employee => employee.id === id);
  }, [employees]);

  // Add a new employee
  const addEmployee = useCallback(async (employee: Partial<Employee>): Promise<Employee | null> => {
    setIsLoading(true);
    try {
      // Format employee data for API
      const { data, error } = await supabase.from('employees').insert([{
        employee_id: employee.employeeId,
        first_name: employee.firstName || employee.name?.split(' ')[0] || '',
        last_name: employee.lastName || employee.name?.split(' ')[1] || '',
        email: employee.email || '',
        employee_type: employee.employeeType || 'permanent',
        department: employee.department || '',
        joining_date: employee.joiningDate || new Date().toISOString(),
        status: employee.status === undefined ? true : employee.status,
        client_id: employee.clientId || null,
      }]).select().single();

      if (error) {
        throw error;
      }

      // Convert API response to our Employee model
      const newEmployee: Employee = {
        id: data.id,
        employeeId: data.employee_id,
        name: `${data.first_name} ${data.last_name}`,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email || '',
        phone: '',
        dateOfBirth: '',
        address: '',
        joiningDate: data.joining_date,
        department: data.department || '',
        position: data.position || '',
        employeeType: data.employee_type as Employee['employeeType'],
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        clientId: data.client_id,
        documents: [],
      };

      // Update local state
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update an employee
  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setEmployees(prev =>
        prev.map(employee => (employee.id === id ? { ...employee, ...data } : employee))
      );
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete an employee
  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);

      if (error) {
        throw error;
      }

      setEmployees(prev => prev.filter(employee => employee.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    employees,
    fetchEmployees,
    getEmployee,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    isLoading,
  };
};
