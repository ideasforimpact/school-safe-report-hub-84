
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, EmployeeApplicationFields, EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { Json } from '@/integrations/supabase/types';

// Helper function to map database records to our Employee type format
const mapDbRecordToEmployee = (record: any): Employee => {
  return {
    id: record.id,
    userId: record.user_id,
    employeeId: record.employee_id,
    firstName: record.first_name,
    lastName: record.last_name,
    email: record.email,
    phone: record.phone,
    employeeType: record.employee_type as EmployeeType,
    department: record.department as DepartmentType,
    joiningDate: record.joining_date,
    status: record.status as EmploymentStatus,
    applicationFields: record.application_fields as EmployeeApplicationFields,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
};

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
    const employees = data.map(mapDbRecordToEmployee);
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

    return mapDbRecordToEmployee(data);
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
      application_fields: employeeData.applicationFields as unknown as Json
    };

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
    const dbUpdates: Record<string, any> = {};
    
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
    if (updates.applicationFields !== undefined) dbUpdates.application_fields = updates.applicationFields as unknown as Json;

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

// Get module permissions for an employee
export const getEmployeeModulesFromApi = async (employeeId: string): Promise<Array<{id: string, moduleId: string}>> => {
  try {
    const { data, error } = await supabase
      .from('employee_modules')
      .select('id, module_id')
      .eq('employee_id', employeeId);

    if (error) {
      console.error("Error fetching employee modules:", error);
      toast.error("Failed to fetch employee module permissions");
      throw error;
    }

    return data.map(record => ({
      id: record.id,
      moduleId: record.module_id
    }));
  } catch (error) {
    console.error("Error in getEmployeeModulesFromApi:", error);
    toast.error("Failed to fetch employee module permissions");
    throw error;
  }
};

// Add module permission to employee
export const addModulePermissionToApi = async (
  employeeId: string,
  moduleId: string
): Promise<{id: string, employeeId: string, moduleId: string}> => {
  try {
    const { data, error } = await supabase
      .from('employee_modules')
      .insert({
        employee_id: employeeId,
        module_id: moduleId
      })
      .select('*')
      .single();

    if (error) {
      console.error("Error adding module permission:", error);
      toast.error("Failed to add module permission");
      throw error;
    }

    toast.success("Module permission added successfully");
    
    return {
      id: data.id,
      employeeId: data.employee_id,
      moduleId: data.module_id
    };
  } catch (error) {
    console.error("Error in addModulePermissionToApi:", error);
    toast.error("Failed to add module permission");
    throw error;
  }
};

// Remove module permission from employee
export const removeModulePermissionFromApi = async (
  employeeId: string,
  moduleId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('module_id', moduleId);

    if (error) {
      console.error("Error removing module permission:", error);
      toast.error("Failed to remove module permission");
      throw error;
    }

    toast.success("Module permission removed successfully");
  } catch (error) {
    console.error("Error in removeModulePermissionFromApi:", error);
    toast.error("Failed to remove module permission");
    throw error;
  }
};

// This function is maintained for backward compatibility but will now update the application_fields in the employee record
export const updateModulePermissionsInApi = async (
  id: string,
  modulePermissions: Partial<ModulePermissions>
): Promise<Employee | null> => {
  try {
    // First, get the current employee to access their details
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

    // Update application fields with the new module permissions for backward compatibility
    const applicationFields = employee.application_fields || {};
    
    // Need to safely extract modulePermissions from applicationFields which could be various JSON types
    let currentModulePermissions: ModulePermissions = {
      superAdmin: false,
      incidentReporting: false,
      incidentAdmin: false,
      assessmentUser: false,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: false
    };

    // Only try to access modulePermissions if applicationFields is an object
    if (applicationFields && typeof applicationFields === 'object' && !Array.isArray(applicationFields)) {
      // Safe type assertion since we've verified it's an object
      const appFields = applicationFields as Record<string, any>;
      if (appFields.modulePermissions && typeof appFields.modulePermissions === 'object') {
        currentModulePermissions = {
          ...currentModulePermissions,
          ...appFields.modulePermissions
        };
      }
    }

    // Create a new application fields object instead of using spread on potentially non-object applicationFields
    let updatedAppFields: Record<string, any> = {};
    
    // Copy existing application fields if it's an object
    if (applicationFields && typeof applicationFields === 'object' && !Array.isArray(applicationFields)) {
      updatedAppFields = { ...applicationFields as Record<string, any> };
    }
    
    // Add the module permissions to the object
    updatedAppFields.modulePermissions = {
      ...currentModulePermissions,
      ...modulePermissions
    };

    // Update the employee with the new application fields
    const { data, error } = await supabase
      .from('employees')
      .update({
        application_fields: updatedAppFields as unknown as Json
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
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in updateModulePermissionsInApi:", error);
    toast.error("Failed to update module permissions");
    return null;
  }
};
