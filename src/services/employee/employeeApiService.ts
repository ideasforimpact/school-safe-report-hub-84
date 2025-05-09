
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, EmployeeApplicationFields } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';

// API service for employees using Supabase directly
export const getAllEmployeesFromApi = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    // Convert the database records to our Employee type format
    const employees = data.map(record => ({
      id: record.id,
      userId: record.user_id,
      employeeId: record.employee_id,
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email,
      phone: record.phone,
      employeeType: record.employee_type,
      department: record.department,
      joiningDate: record.joining_date,
      status: record.status,
      applicationFields: record.application_fields,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    return employees || [];
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee details");
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employeeType: data.employee_type,
      department: data.department,
      joiningDate: data.joining_date,
      status: data.status,
      applicationFields: data.application_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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
    // Convert the Employee object to match the database schema
    const dbEmployee = {
      user_id: employeeData.userId,
      employee_id: employeeData.employeeId,
      first_name: employeeData.firstName,
      last_name: employeeData.lastName,
      email: employeeData.email,
      phone: employeeData.phone,
      employee_type: employeeData.employeeType,
      department: employeeData.department,
      joining_date: employeeData.joiningDate,
      status: employeeData.status,
      application_fields: employeeData.applicationFields
    };

    const { data, error } = await supabase
      .from('employees')
      .insert([dbEmployee])
      .select('*')
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }

    toast.success("Employee added successfully");
    
    // Convert the response back to our Employee type
    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employeeType: data.employee_type,
      department: data.department,
      joiningDate: data.joining_date,
      status: data.status,
      applicationFields: data.application_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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
    const dbUpdates: any = {};
    
    if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.employeeType !== undefined) dbUpdates.employee_type = updates.employeeType;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.joiningDate !== undefined) dbUpdates.joining_date = updates.joiningDate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.applicationFields !== undefined) dbUpdates.application_fields = updates.applicationFields;

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
    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employeeType: data.employee_type,
      department: data.department,
      joiningDate: data.joining_date,
      status: data.status,
      applicationFields: data.application_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error("Error in updateEmployeeInApi:", error);
    toast.error("Failed to update employee");
    throw error;
  }
};

export const deleteEmployeeFromApi = async (id: string): Promise<void> => {
  try {
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

export const updateModulePermissionsInApi = async (
  id: string,
  modulePermissions: Partial<ModulePermissions>
): Promise<Employee | null> => {
  try {
    // First, get the current employee to access the application fields
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching employee:", fetchError);
      toast.error("Failed to update module permissions");
      throw fetchError;
    }

    // Update application fields with the new module permissions
    const applicationFields = employee.application_fields || {};
    const updatedApplicationFields = {
      ...applicationFields,
      modulePermissions: {
        ...applicationFields.modulePermissions || {
          superAdmin: false,
          incidentReporting: false,
          incidentAdmin: false,
          assessmentUser: false,
          assessmentsAdmin: false,
          employeeVerificationAdmin: false,
          grievancesAdmin: false,
          transportSafetyAdmin: false,
          eduSafeResourceAccess: false
        },
        ...modulePermissions
      }
    };

    // Update the employee with the new application fields
    const { data, error } = await supabase
      .from('employees')
      .update({
        application_fields: updatedApplicationFields
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating module permissions:", error);
      toast.error("Failed to update module permissions");
      throw error;
    }

    toast.success("Module permissions updated successfully");
    
    // Convert the response back to our Employee type
    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employeeType: data.employee_type,
      department: data.department,
      joiningDate: data.joining_date,
      status: data.status,
      applicationFields: data.application_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error("Error in updateModulePermissionsInApi:", error);
    toast.error("Failed to update module permissions");
    return null;
  }
};
