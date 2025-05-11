
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

    // Log the mapped DB employee data for debugging
    console.log("Adding employee to API with data:", dbEmployee);
    console.log("Original clientId:", employeeData.clientId);
    console.log("Mapped client_id:", dbEmployee.client_id);

    // Explicitly define required fields for Supabase insert to prevent type error
    const { data, error } = await supabase
      .from('employees')
      .insert({
        employee_id: dbEmployee.employee_id,
        first_name: dbEmployee.first_name,
        last_name: dbEmployee.last_name,
        email: dbEmployee.email,
        employee_type: dbEmployee.employee_type,
        department: dbEmployee.department,
        joining_date: dbEmployee.joining_date,
        status: dbEmployee.status,
        client_id: dbEmployee.client_id, // Explicitly include client_id
        user_id: dbEmployee.user_id
      })
      .select('*')
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }

    console.log("Employee added to API successfully:", data);
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

export const deactivateEmployeeInApi = async (id: string): Promise<Employee> => {
  try {
    // Update the employee status to 'inactive'
    const { data, error } = await supabase
      .from('employees')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error deactivating employee:", error);
      toast.error("Failed to deactivate employee");
      throw error;
    }

    // Clear all module permissions for deactivated employee
    const { error: moduleError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', id);

    if (moduleError) {
      console.error("Error removing module permissions:", moduleError);
      toast.warning("Employee deactivated but there was an issue updating permissions");
    } else {
      console.log("Successfully removed all module permissions for deactivated employee");
    }

    toast.success("Employee deactivated successfully");
    
    // Convert the response back to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in deactivateEmployeeInApi:", error);
    toast.error("Failed to deactivate employee");
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
