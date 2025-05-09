
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { ModulePermissions } from '@/contexts/auth/types';

// Get all module permissions for an employee
export const getEmployeeModulePermissions = async (employeeId: string): Promise<ModulePermissions> => {
  try {
    // Default permissions object with all permissions set to false
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

    // Fetch the employee's module permissions from employee_modules table
    const { data: moduleEntries, error } = await supabase
      .from('employee_modules')
      .select('modules(key)')
      .eq('employee_id', employeeId);

    if (error) {
      console.error("Error fetching employee module permissions:", error);
      toast.error("Failed to fetch module permissions");
      return defaultPermissions;
    }

    // Update permissions based on the modules assigned to the employee
    const permissions = { ...defaultPermissions };
    moduleEntries.forEach(entry => {
      const moduleKey = entry.modules?.key;
      if (moduleKey && moduleKey in permissions) {
        permissions[moduleKey as keyof ModulePermissions] = true;
      }
    });

    return permissions;
  } catch (error) {
    console.error("Error in getEmployeeModulePermissions:", error);
    toast.error("Failed to fetch module permissions");
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

// Update module permissions for an employee
export const updateEmployeeModulePermissions = async (
  employeeId: string,
  permissions: ModulePermissions
): Promise<boolean> => {
  try {
    // First, get all available modules to map permission keys to module IDs
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, key');

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      toast.error("Failed to update module permissions");
      return false;
    }

    // Create a map of module keys to IDs
    const moduleKeyToId = Object.fromEntries(
      modules.map(module => [module.key, module.id])
    );

    // Delete all existing module permissions for this employee to reset
    const { error: deleteError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error("Error deleting existing module permissions:", deleteError);
      toast.error("Failed to update module permissions");
      return false;
    }

    // Add new module permissions based on the provided permissions object
    const modulesToAdd = [];
    for (const [key, value] of Object.entries(permissions)) {
      if (value && moduleKeyToId[key]) {
        modulesToAdd.push({
          employee_id: employeeId,
          module_id: moduleKeyToId[key]
        });
      }
    }

    if (modulesToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('employee_modules')
        .insert(modulesToAdd);

      if (insertError) {
        console.error("Error inserting module permissions:", insertError);
        toast.error("Failed to update module permissions");
        return false;
      }
    }

    toast.success("Module permissions updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateEmployeeModulePermissions:", error);
    toast.error("Failed to update module permissions");
    return false;
  }
};

// Get permissions when deactivating a user
export const getDeactivatedUserPermissions = async (userId: string): Promise<ModulePermissions> => {
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
};
