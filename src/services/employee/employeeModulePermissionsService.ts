
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { Json } from '@/integrations/supabase/types';
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
