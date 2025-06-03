import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '../types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, employeeData } = useAuth();

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  const fetchEmployees = useCallback(async () => {
    if (!clientId) {
      console.log('No client ID available - cannot fetch employees');
      setEmployees([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching employees for client:', clientId);
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address,
          department,
          position,
          employee_type,
          joining_date,
          status,
          client_id,
          created_at,
          updated_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
        return;
      }

      const formattedEmployees: Employee[] = data.map(emp => ({
        id: emp.id,
        employeeId: emp.employee_id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        phone: emp.phone || '',
        dateOfBirth: emp.date_of_birth || '',
        address: emp.address || '',
        department: emp.department,
        position: emp.position || '',
        employeeType: emp.employee_type as "permanent" | "contract" | "temporary" | "part_time" | "consultant" | "intern",
        joiningDate: emp.joining_date,
        status: emp.status,
        clientId: emp.client_id,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at
      }));

      console.log('Fetched employees:', formattedEmployees);
      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error in fetchEmployees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientId) {
      toast.error('No client context available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: employeeData.employeeId,
          first_name: employeeData.name.split(' ')[0],
          last_name: employeeData.name.split(' ').slice(1).join(' '),
          email: employeeData.email,
          phone: employeeData.phone,
          date_of_birth: employeeData.dateOfBirth,
          address: employeeData.address,
          department: employeeData.department,
          position: employeeData.position,
          employee_type: employeeData.employeeType,
          joining_date: employeeData.joiningDate,
          status: employeeData.status,
          client_id: clientId
        }])
        .select()
        .single();

      if (error) throw error;

      const newEmployee: Employee = {
        id: data.id,
        employeeId: data.employee_id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone || '',
        dateOfBirth: data.date_of_birth || '',
        address: data.address || '',
        department: data.department,
        position: data.position || '',
        employeeType: data.employee_type as "permanent" | "contract" | "temporary" | "part_time" | "consultant" | "intern",
        joiningDate: data.joining_date,
        status: data.status,
        clientId: data.client_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setEmployees(prev => [newEmployee, ...prev]);
      toast.success('Employee added successfully');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  }, [clientId]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) {
        const nameParts = updates.name.split(' ');
        dbUpdates.first_name = nameParts[0];
        dbUpdates.last_name = nameParts.slice(1).join(' ');
      }
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      if (updates.employeeType) dbUpdates.employee_type = updates.employeeType;
      if (updates.joiningDate) dbUpdates.joining_date = updates.joiningDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', id)
        .eq('client_id', clientId) // Ensure we only update employees from current client
        .select()
        .single();

      if (error) throw error;

      const updatedEmployee: Employee = {
        id: data.id,
        employeeId: data.employee_id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone || '',
        dateOfBirth: data.date_of_birth || '',
        address: data.address || '',
        department: data.department,
        position: data.position || '',
        employeeType: data.employee_type as "permanent" | "contract" | "temporary" | "part_time" | "consultant" | "intern",
        joiningDate: data.joining_date,
        status: data.status,
        clientId: data.client_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  }, [clientId]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId); // Ensure we only delete employees from current client

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  }, [clientId]);

  const getEmployee = useCallback((id: string) => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  return {
    employees,
    isLoading,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
};
