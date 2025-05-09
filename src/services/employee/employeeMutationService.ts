
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { mapDbRecordToEmployee, mapEmployeeToDbRecord } from './utils/employeeMappers';

export const addEmployeeToApi = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  try {
    // Convert the Employee object to match the database schema
    const dbEmployee = mapEmployeeToDbRecord(employeeData);

    const { data, error } = await supabase
      .from('employees')
      .insert(dbEmployee)
      .select('*')
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }

    toast.success("Employee added successfully");
    
    // Convert the response back to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in addEmployeeToApi:", error);
    toast.error("Failed to add employee");
    throw error;
  }
};

export const updateEmployeeInApi = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  try {
    // Convert the updates to match the database schema
    const dbUpdates = mapEmployeeToDbRecord(updates);

    const { data, error } = await supabase
      .from('employees')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
      throw error;
    }

    toast.success("Employee updated successfully");
    
    // Convert the response back to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in updateEmployeeInApi:", error);
    toast.error("Failed to update employee");
    throw error;
  }
};

export const deleteEmployeeFromApi = async (id: string): Promise<void> => {
  try {
    // First, delete all module permissions for this employee
    const { error: moduleError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', id);

    if (moduleError) {
      console.error("Error deleting employee module permissions:", moduleError);
      // Continue with employee deletion even if module deletion fails
    }

    // Then delete the employee
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
      throw error;
    }

    toast.success("Employee deleted successfully");
  } catch (error) {
    console.error("Error in deleteEmployeeFromApi:", error);
    toast.error("Failed to delete employee");
    throw error;
  }
};
