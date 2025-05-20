
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModuleAccessItem } from '@/types/moduleAccess';

// Update employee module permissions by replacing existing ones
export const updateEmployeeModulePermissions = async (
  employeeId: string,
  permissions: ModuleAccessItem[] | { [key: string]: boolean }
): Promise<boolean> => {
  try {
    // First, delete existing permissions
    const { error: deleteError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error("Error deleting existing module permissions:", deleteError);
      return false;
    }

    // Convert permissions object to array if needed
    const permissionsArray = Array.isArray(permissions) 
      ? permissions 
      : Object.entries(permissions)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => ({
            name: key,
            key,
            employeeId,
            module_id: key // Use key as module_id temporarily
          }));

    // Don't proceed if no permissions to add
    if (!permissionsArray.length) {
      console.log("No permissions to add");
      return true;
    }

    // Create records to insert
    const modulesToInsert = permissionsArray.map(module => ({
      employee_id: employeeId,
      module_id: module.module_id,
      access_level: {}
    }));

    // Insert new permissions
    const { error: insertError } = await supabase
      .from('employee_modules')
      .insert(modulesToInsert);

    if (insertError) {
      console.error("Error adding module permissions:", insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating employee module permissions:", error);
    return false;
  }
};

// Get employee module access items
export const getEmployeeModuleAccessItems = async (employeeId: string): Promise<ModuleAccessItem[]> => {
  try {
    console.log("Fetching module access items for employee ID:", employeeId);
    
    // First get the employee modules
    const { data: employeeModules, error: employeeModulesError } = await supabase
      .from('employee_modules')
      .select(`
        module_id,
        access_level,
        modules(id, name, key, icon, level)
      `)
      .eq('employee_id', employeeId);

    if (employeeModulesError) {
      console.error("Error fetching employee modules:", employeeModulesError);
      return [];
    }

    console.log("Retrieved employee modules:", employeeModules);

    // If no modules found, try fetching client modules as fallback
    if (!employeeModules || employeeModules.length === 0) {
      // First get the employee's client ID
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('client_id')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee || !employee.client_id) {
        console.error("Error fetching employee client ID:", employeeError);
        return [];
      }

      // Now get all available modules for this client
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select(`
          module_id,
          access_level,
          modules(id, name, key, icon, level)
        `)
        .eq('client_id', employee.client_id)
        .eq('enabled', true);

      if (clientModulesError) {
        console.error("Error fetching client modules:", clientModulesError);
        return [];
      }

      console.log("No employee modules found, using client modules:", clientModules);

      // Map client modules to ModuleAccessItem format
      return clientModules.map(item => {
        const moduleObj = item.modules;
        return {
          name: moduleObj?.name || 'Unknown Module',
          key: moduleObj?.key || moduleObj?.id || item.module_id,
          employeeId: employeeId,
          module_id: item.module_id
        };
      }).filter(item => !!item.module_id);
    }

    // Map the database records to our ModuleAccessItem model
    const moduleAccessItems: ModuleAccessItem[] = employeeModules.map(item => {
      const moduleObj = item.modules;
      return {
        name: moduleObj?.name || 'Unknown Module',
        key: moduleObj?.key || moduleObj?.id || item.module_id,
        employeeId: employeeId,
        module_id: item.module_id
      };
    }).filter(item => !!item.module_id);

    console.log("Mapped module access items:", moduleAccessItems);
    return moduleAccessItems;
  } catch (error) {
    console.error("Error getting employee module access items:", error);
    return [];
  }
};
