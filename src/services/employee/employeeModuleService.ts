
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
      //console.log("No permissions to add");
      return true;
    }

    // Create records to insert
    const modulesToInsert = permissionsArray.map(module => {
      // Extract is_admin from the level property, default to false
      let isAdmin = false;
      
      if (module.level && typeof module.level === 'object') {
        isAdmin = module.level.is_admin === true;
      }

      return {
        employee_id: employeeId,
        module_id: module.module_id,
        level: { is_admin: isAdmin }
      };
    });

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
    const { data, error } = await supabase
      .from('employee_modules')
      .select('*, modules(id, name)')
      .eq('employee_id', employeeId);

    if (error) {
      console.error("Error fetching module permissions:", error);
      return [];
    }

    // Map to ModuleAccessItem format
    return data.map(item => {
      const moduleName = item.modules?.name || 'Unknown Module';
      const moduleKey = item.module_id;
      
      // Safely handle the level property which can be Json type from database
      let levelObject: { is_admin?: boolean; [key: string]: any } = {};
      if (item.level && typeof item.level === 'object' && !Array.isArray(item.level)) {
        levelObject = item.level as { is_admin?: boolean; [key: string]: any };
      }
      
      return {
        name: moduleName,
        key: moduleKey,
        employeeId: employeeId,
        module_id: item.module_id,
        level: levelObject
      };
    });
  } catch (error) {
    console.error("Error getting employee module access items:", error);
    return [];
  }
};
