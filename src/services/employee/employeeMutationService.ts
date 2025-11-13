import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { mapDbRecordToEmployee, mapEmployeeToDbRecord } from './utils/employeeMappers';
import { updateEmployeeModulePermissions } from './employeeModuleService';
import { ModuleAccessItem } from '@/types/moduleAccess';

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

    // Try to use the edge function first
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: JSON.stringify({
          operation: 'create',
          employee: employeeData
        })
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }
      
      // Check if the response contains an error 
      if (data && data.error) {
        console.error("Error response from edge function:", data.error);
        
        // Check for duplicate email error
        if (data.code === 'DUPLICATE_EMAIL') {
          const errorMessage = data.error;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMAIL", 
            error: errorMessage 
          };
        } 
        // Check for duplicate employee ID error
        else if (data.code === 'DUPLICATE_EMPLOYEE_ID') {
          const errorMessage = data.error;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMPLOYEE_ID", 
            error: errorMessage 
          };
        } else {
          // For other errors, show a generic message
          toast.error(data.error || "Failed to add employee");
          throw data;
        }
      }
      
      // If we got here, it means the operation was successful
      console.log("Employee created via edge function:", data);
      
      // Only show success message if we successfully added the employee
      if (data && data.data) {
        toast.success("Employee added successfully");
        // Convert the response back to our Employee type and return it
        return mapDbRecordToEmployee(data.data);
      }
      
      // If we don't have data.data, throw an error
      throw new Error("Invalid response from edge function");
    } catch (edgeFunctionError: any) {
      // If the edge function call fails or returns an error, 
      // we'll log it and fall back to the direct Supabase API
      console.error("Edge function error, falling back to direct API call:", edgeFunctionError);
      
      // If this is a duplicate email or employee ID error we already handled, re-throw it
      if (edgeFunctionError.code === "DUPLICATE_EMAIL" || edgeFunctionError.code === "DUPLICATE_EMPLOYEE_ID") {
        throw edgeFunctionError;
      }
      
      // Otherwise continue with the fallback approach
    }

    // Fallback: Direct Supabase API call if edge function fails
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
        status: true, // Always set to true (active) for new employees
        client_id: dbEmployee.client_id, // Make sure client_id is included
        user_id: dbEmployee.user_id
      })
      .select('*')
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      
      // Check if the error message indicates a duplicate email
      if (error.message.includes('duplicate') && error.message.includes('email')) {
        const errorMessage = `An employee with email ${employeeData.email} already exists for this client.`;
        toast.error(errorMessage);
        throw { 
          code: "DUPLICATE_EMAIL", 
          error: errorMessage 
        };
      } 
      // Check if the error message indicates a duplicate employee ID
      else if (error.message.includes('duplicate') && error.message.includes('employee_id')) {
        const errorMessage = `An employee with Employee ID ${employeeData.employeeId} already exists for this client.`;
        toast.error(errorMessage);
        throw { 
          code: "DUPLICATE_EMPLOYEE_ID", 
          error: errorMessage 
        };
      } else {
        toast.error("Failed to add employee");
      }
      
      throw error;
    }

    console.log("Employee added to API successfully:", data);
    
    // If the employee has modulePermissions, update them in the database
    if (employeeData.modulePermissions) {
      try {
        await updateEmployeeModulePermissions(data.id, employeeData.modulePermissions);
      } catch (moduleError) {
        console.error("Error updating module permissions:", moduleError);
        // Continue with employee creation even if module permission update fails
        toast.warning("Employee created but module permissions could not be set");
      }
    }
    
    // If there's a module access payload, add it
    if (employeeData.moduleAccessPayload) {
      try {
        // Ensure module_id exists in each ModuleAccessItem
        const updatedModuleAccessPayload = employeeData.moduleAccessPayload.map(item => {
          // Type guard to check if module_id exists
          if (!('module_id' in item) || !item.module_id) {
            return {
              ...item,
              module_id: item.key // Use key as module_id if not provided
            };
          }
          return item;
        });
        
        await updateEmployeeModulePermissions(data.id, updatedModuleAccessPayload);
      } catch (accessError) {
        console.error("Error adding module access:", accessError);
        // Continue with employee creation even if module access update fails
        toast.warning("Employee created but some module access could not be set");
      }
    }
    
    // Only show success message if we actually succeeded
    toast.success("Employee added successfully");
    
    // Convert the response back to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error: any) {
    console.error("Error in addEmployeeToApi:", error);
    
    // Don't show a duplicate error toast - the error has already been shown
    // or will be handled by the caller
    
    throw error; // Always rethrow to allow proper handling upstream
  }
};

export const updateEmployeeInApi = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  try {
    // Get the current employee data to extract client_id if not provided in updates
    const { data: currentEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('client_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching current employee:", fetchError);
      throw fetchError;
    }

    // Ensure client_id is included in the updates
    const employeeDataWithClientId = {
      ...updates,
      id,
      clientId: updates.clientId || currentEmployee.client_id,
      client_id: updates.clientId || currentEmployee.client_id
    };

    console.log("Updating employee with data:", employeeDataWithClientId);

    // Try to use the edge function first
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: JSON.stringify({
          operation: 'update',
          employee: employeeDataWithClientId
        })
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }
      
      // Check if the response contains an error 
      if (data && data.error) {
        console.error("Error response from edge function:", data.error);
        
        // Check for duplicate email error
        if (data.code === 'DUPLICATE_EMAIL') {
          const errorMessage = data.error;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMAIL", 
            error: errorMessage 
          };
        } 
        // Check for duplicate employee ID error
        else if (data.code === 'DUPLICATE_EMPLOYEE_ID') {
          const errorMessage = data.error;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMPLOYEE_ID", 
            error: errorMessage 
          };
        } else {
          toast.error(data.error || "Failed to update employee");
          throw data;
        }
      }
      
      // If we got here, it means the operation was successful
      console.log("Employee updated via edge function:", data);
      
      if (data && data.data) {
        toast.success("Employee updated successfully");
        return mapDbRecordToEmployee(data.data);
      }
      
      throw new Error("Invalid response from edge function");
    } catch (edgeFunctionError: any) {
      console.error("Edge function error, falling back to direct API call:", edgeFunctionError);
      
      // If this is a duplicate error we already handled, re-throw it
      if (edgeFunctionError.code === "DUPLICATE_EMAIL" || edgeFunctionError.code === "DUPLICATE_EMPLOYEE_ID") {
        throw edgeFunctionError;
      }
      
      // Fallback: Convert the updates to match the database schema
      const dbUpdates = mapEmployeeToDbRecord(updates);

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating employee:", error);
        
        // Check for duplicate errors in fallback
        if (error.message.includes('duplicate') && error.message.includes('email')) {
          const errorMessage = `An employee with email ${updates.email} already exists for this client.`;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMAIL", 
            error: errorMessage 
          };
        } else if (error.message.includes('duplicate') && error.message.includes('employee_id')) {
          const errorMessage = `An employee with Employee ID ${updates.employeeId} already exists for this client.`;
          toast.error(errorMessage);
          throw { 
            code: "DUPLICATE_EMPLOYEE_ID", 
            error: errorMessage 
          };
        } else {
          toast.error("Failed to update employee");
        }
        
        throw error;
      }

      toast.success("Employee updated successfully");
      
      // Convert the response back to our Employee type
      return mapDbRecordToEmployee(data);
    }
  } catch (error) {
    console.error("Error in updateEmployeeInApi:", error);
    
    // Don't show duplicate error toast if already handled
    if (!(error as any).code || !['DUPLICATE_EMAIL', 'DUPLICATE_EMPLOYEE_ID'].includes((error as any).code)) {
      toast.error("Failed to update employee");
    }
    
    throw error;
  }
};

export const deactivateEmployeeInApi = async (id: string): Promise<Employee> => {
  try {
    console.log("deactivateEmployeeInApi called with ID:", id);
    
    // Try to use the employee-management edge function first
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not set');
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/employee-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
      },
      body: JSON.stringify({
        operation: 'deactivate',
        id: id
      })
    });
    
    const result = await response.json();
    console.log("Edge function deactivation response:", result);
    
    if (!response.ok || result.error) {
      console.error("Error from edge function:", result.error);
      throw new Error(result.error || "Failed to deactivate employee");
    }
    
    if (result.data) {
      return mapDbRecordToEmployee(result.data);
    }
    
    // Fallback if the edge function doesn't return data
    // Update the employee status to 'inactive' (false) directly via Supabase
    const { data, error } = await supabase
      .from('employees')
      .update({ status: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error deactivating employee:", error);
      toast.error(`Failed to deactivate employee: ${error.message}`);
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

    // toast.success("Employee deactivated successfully");
    
    // Convert the response back to our Employee type
    return mapDbRecordToEmployee(data);
  } catch (error) {
    console.error("Error in deactivateEmployeeInApi:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Failed to deactivate employee: ${errorMessage}`);
    throw error;
  }
};

export const deleteEmployeeFromApi = async (id: string): Promise<{ success: boolean, error?: string }> => {
  try {
    // Try to use the employee-management edge function first
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not set');
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/employee-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token || '')}`
      },
      body: JSON.stringify({
        operation: 'delete',
        id: id
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || result.error) {
      console.error("Error from edge function:", result.error);
      throw new Error(result.error || "Failed to delete employee");
    }
    
    return { success: true };
  } catch (edgeFunctionError) {
    console.error("Edge function error, falling back to direct API call:", edgeFunctionError);
    
    try {
      // Fallback: Try direct Supabase API calls if edge function fails
      
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
        throw error;
      }
  
      return { success: true };
    } catch (error) {
      console.error("Error in deleteEmployeeFromApi:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to delete employee: ${errorMessage}`);
    }
  }
};
