
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { mapDbRecordToEmployee } from './utils/employeeMappers';

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

// Update module permissions for backward compatibility
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

    // Convert the employee to our application model
    const employeeModel = mapDbRecordToEmployee(employee);

    // We'll now use the employee_modules table directly
    // For each module permission, add or remove the corresponding entry
    for (const [moduleName, isEnabled] of Object.entries(modulePermissions)) {
      // Get the module ID for this permission
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('key', moduleName)
        .single();

      if (moduleError) {
        console.error(`Error finding module with key ${moduleName}:`, moduleError);
        continue; // Skip this module and continue with others
      }

      const moduleId = moduleData.id;

      if (isEnabled) {
        // Add the permission
        await addModulePermissionToApi(id, moduleId).catch(err => {
          console.error(`Error adding module permission for ${moduleName}:`, err);
        });
      } else {
        // Remove the permission
        await removeModulePermissionFromApi(id, moduleId).catch(err => {
          console.error(`Error removing module permission for ${moduleName}:`, err);
        });
      }
    }

    toast.success("Module permissions updated successfully");
    
    // Return the updated employee
    return employeeModel;
  } catch (error) {
    console.error("Error in updateModulePermissionsInApi:", error);
    toast.error("Failed to update module permissions");
    return null;
  }
};
