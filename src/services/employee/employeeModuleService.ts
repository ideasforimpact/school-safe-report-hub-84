
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

// Force refresh modules for a specific employee across all sessions
export const forceRefreshEmployeeModules = async (employeeId: string): Promise<void> => {
  try {
    // This function will trigger a notification to refresh modules
    // We could implement a separate table for notifications or use Supabase realtime
    console.log(`Forcing module refresh for employee: ${employeeId}`);
    
    // The actual refresh will be handled by the real-time listener in useRealtimeModuleSync
    // This function exists as a placeholder for future expansion
  } catch (error) {
    console.error("Error forcing module refresh:", error);
  }
};

// Get module access for user (handles both super admin and regular employees).
// Routes through the `employee-management` edge function (operation:
// 'get_module_access') instead of querying `employee_modules`/`client_modules`
// directly from the browser.
export const getModuleAccessForUser = async (employee: { id: string; isSuperAdmin?: boolean; clientId?: string }): Promise<ModuleAccessItem[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('employee-management', {
      body: JSON.stringify({
        operation: 'get_module_access',
        employeeId: employee.id,
        clientId: employee.clientId,
        isSuperAdmin: employee.isSuperAdmin || false,
      }),
    });

    if (error) {
      console.error("Error fetching module access:", error);
      return [];
    }
    if (!data?.success) {
      console.error("Error fetching module access:", data?.error);
      return [];
    }

    return (data.modules || []) as ModuleAccessItem[];
  } catch (error) {
    console.error("Error getting module access for user:", error);
    return [];
  }
};
