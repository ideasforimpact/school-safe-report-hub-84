
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, EmployeeApplicationFields } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';

// API service for employees using Supabase edge functions
export const getAllEmployeesFromApi = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('employee-management/employees', {
      method: 'GET',
    });

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    return data.employees || [];
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('employee-management/employee', {
      method: 'GET',
      body: { id },
    });

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee details");
      throw error;
    }

    return data.employee || null;
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    toast.error("Failed to fetch employee details");
    throw error;
  }
};

export const addEmployeeToApi = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  try {
    const { data, error } = await supabase.functions.invoke('employee-management/create', {
      method: 'POST',
      body: { employee: employeeData },
    });

    if (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }

    toast.success("Employee added successfully");
    return data.employee;
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
    const { data, error } = await supabase.functions.invoke('employee-management/update', {
      method: 'POST',
      body: { employee: { id, ...updates } },
    });

    if (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
      throw error;
    }

    toast.success("Employee updated successfully");
    return data.employee;
  } catch (error) {
    console.error("Error in updateEmployeeInApi:", error);
    toast.error("Failed to update employee");
    throw error;
  }
};

export const deleteEmployeeFromApi = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('employee-management/delete', {
      method: 'POST',
      body: { id },
    });

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

export const updateModulePermissionsInApi = async (
  id: string,
  modulePermissions: Partial<ModulePermissions>
): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('employee-management/update-permissions', {
      method: 'POST',
      body: { id, modulePermissions },
    });

    if (error) {
      console.error("Error updating module permissions:", error);
      toast.error("Failed to update module permissions");
      throw error;
    }

    toast.success("Module permissions updated successfully");
    return data.employee;
  } catch (error) {
    console.error("Error in updateModulePermissionsInApi:", error);
    toast.error("Failed to update module permissions");
    return null;
  }
};
