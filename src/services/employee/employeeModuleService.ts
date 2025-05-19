
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { ModulePermissions } from '@/contexts/auth/types';

/**
 * Get module permissions for an employee
 * @param employeeId The UUID of the employee
 * @returns The module permissions object
 */
export const getEmployeeModulePermissions = async (employeeId: string): Promise<ModulePermissions> => {
  try {
    console.log("Getting module permissions for employee:", employeeId);
    
    // Get all module entries for this employee from the database
    const { data, error } = await supabase
      .from('employee_modules')
      .select('module_id, roles(key)')
      .eq('employee_id', employeeId);

    if (error) {
      console.error("Error fetching employee modules:", error);
      throw error;
    }

    // Create a default permissions object with all permissions set to false
    const defaultPermissions: ModulePermissions = {
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

    // If no data, return default permissions
    if (!data || data.length === 0) {
      console.log("No module permissions found for employee:", employeeId);
      return defaultPermissions;
    }

    console.log("Module entries found for employee:", data.length);
    console.log("Raw module entries:", data);
    
    // Map the module keys from the database to the permissions object
    const permissions = { ...defaultPermissions };

    data.forEach(moduleEntry => {
      if (moduleEntry.roles?.key) {
        // Convert moduleKey to string explicitly if it might be a symbol
        const moduleKey = String(moduleEntry.roles.key) as keyof ModulePermissions;
        if (moduleKey in permissions) {
          permissions[moduleKey] = true;
          console.log(`Setting permission ${moduleKey} to true`);
        }
      }
    });

    console.log("Final module permissions for employee:", permissions);
    return permissions;
  } catch (error) {
    console.error("Error in getEmployeeModulePermissions:", error);
    // Return default permissions on error
    return {
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
  }
};

/**
 * Update module permissions for an employee
 * @param employeeId The UUID of the employee
 * @param permissions The module permissions object
 */
export const updateEmployeeModulePermissions = async (employeeId: string, permissions: ModulePermissions): Promise<void> => {
  try {
    // First, delete all existing module permissions for this employee
    const { error: deleteError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error("Error deleting employee modules:", deleteError);
      throw deleteError;
    }

    // Get the module IDs for each module key
    const { data: modules, error: moduleError } = await supabase
      .from('roles')
      .select('id, key');

    if (moduleError) {
      console.error("Error fetching roles:", moduleError);
      throw moduleError;
    }

    // Map module keys to their IDs
    const moduleKeyToId: Record<string, string> = {};
    modules?.forEach(module => {
      moduleKeyToId[module.key] = module.id;
    });

    // Create array of module entries to insert
    const moduleEntries = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => ({
        employee_id: employeeId,
        module_id: moduleKeyToId[key],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      .filter(entry => entry.module_id); // Ensure we only add entries for modules that exist

    if (moduleEntries.length === 0) {
      console.log("No module permissions to update");
      return;
    }

    // Insert the new module permissions
    const { error: insertError } = await supabase
      .from('employee_modules')
      .insert(moduleEntries);

    if (insertError) {
      console.error("Error inserting employee modules:", insertError);
      throw insertError;
    }

    console.log(`Successfully updated ${moduleEntries.length} module permissions for employee ${employeeId}`);
  } catch (error) {
    console.error("Error in updateEmployeeModulePermissions:", error);
    toast.error("Failed to update employee module permissions");
    throw error;
  }
};
