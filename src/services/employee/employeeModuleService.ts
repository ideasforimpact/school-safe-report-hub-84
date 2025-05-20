
import { supabase } from '@/integrations/supabase/client';
import { ModulePermissions } from '@/contexts/auth/types';
import { ModuleAccessItem } from '@/contexts/employee/types';
import { toast } from 'sonner';

// Function to update module permissions for an employee
export const updateEmployeeModulePermissions = async (
  employeeId: string,
  modulePermissions: ModulePermissions | ModuleAccessItem[]
): Promise<void> => {
  try {
    console.log("Updating module permissions for employee:", employeeId);
    
    // First, remove all existing module permissions for this employee
    const { error: deleteError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);
      
    if (deleteError) {
      console.error("Error deleting existing module permissions:", deleteError);
      throw deleteError;
    }
    
    // Convert the input to a standardized module access array
    let moduleAccessPayload: ModuleAccessItem[];
    
    // Check if modulePermissions is already an array
    if (Array.isArray(modulePermissions)) {
      moduleAccessPayload = modulePermissions;
    } else {
      // Convert the module permissions object to an array of module access items
      moduleAccessPayload = Object.entries(modulePermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => ({
          name: key,
          employeeId,
          key
        }));
    }
    
    // Add the new module permissions
    if (moduleAccessPayload.length > 0) {
      await addEmployeeModuleAccessBulk(moduleAccessPayload, employeeId);
    }
    
    console.log("Module permissions updated successfully");
  } catch (error) {
    console.error("Error in updateEmployeeModulePermissions:", error);
    toast.error("Failed to update module permissions");
    throw error;
  }
};

// Function to add module access in bulk for an employee
export const addEmployeeModuleAccessBulk = async (
  moduleAccessPayload: ModuleAccessItem[],
  employeeId: string
): Promise<void> => {
  try {
    console.log("Adding module access in bulk for employee:", employeeId);
    console.log("Module access payload:", moduleAccessPayload);
    
    // Use the edge function to handle module access
    const { data, error } = await supabase.functions.invoke('employee-management', {
      body: JSON.stringify({
        operation: 'add_module_access',
        employee: {
          id: employeeId,
          moduleAccessPayload
        }
      })
    });
    
    if (error) {
      console.error("Error adding module access with edge function:", error);
      
      // Fall back to direct database calls if edge function fails
      await Promise.all(moduleAccessPayload.map(async (module) => {
        // Get the module ID from the modules table
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('id')
          .eq('name', module.name)
          .single();
          
        if (moduleError || !moduleData) {
          console.log(`Module not found for name: ${module.name}`);
          return;
        }
        
        // Insert into employee_modules
        const { error: insertError } = await supabase
          .from('employee_modules')
          .insert({
            employee_id: employeeId,
            module_id: moduleData.id,
            access_level: {}
          });
          
        if (insertError) {
          console.error(`Error adding module access for ${module.name}:`, insertError);
        }
      }));
    } else {
      console.log("Module access added successfully via edge function:", data);
    }
  } catch (error) {
    console.error("Error in addEmployeeModuleAccessBulk:", error);
    throw error;
  }
};

// Function to get module permissions for an employee
export const getEmployeeModulePermissions = async (
  employeeId: string
): Promise<ModulePermissions> => {
  try {
    console.log("Getting module permissions for employee:", employeeId);
    
    // Get all modules for reference
    const { data: allModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name, level');
      
    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      throw modulesError;
    }
    
    // Get the employee's module permissions
    const { data: employeeModules, error: permissionsError } = await supabase
      .from('employee_modules')
      .select('module_id, access_level')
      .eq('employee_id', employeeId);
      
    if (permissionsError) {
      console.error("Error fetching employee module permissions:", permissionsError);
      throw permissionsError;
    }
    
    // Create a mapping of module IDs to module keys
    const moduleIdToKey: Record<string, string> = {};
    allModules?.forEach(module => {
      moduleIdToKey[module.id] = module.level;
    });
    
    // Convert to ModulePermissions format
    const modulePermissions: ModulePermissions = {
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
    
    // Set permissions based on the employee's modules
    employeeModules?.forEach(module => {
      const moduleKey = moduleIdToKey[module.module_id];
      if (moduleKey) {
        // Type assertion to treat the key as a key of ModulePermissions
        (modulePermissions as any)[moduleKey] = true;
      } else {
        console.log(`Unknown module_id: ${module.module_id}`);
      }
    });
    
    // Check if employee is a super admin
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('is_super_admin')
      .eq('id', employeeId)
      .single();
      
    if (!employeeError && employee && employee.is_super_admin) {
      modulePermissions.superAdmin = true;
    }
    
    return modulePermissions;
  } catch (error) {
    console.error("Error in getEmployeeModulePermissions:", error);
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

// Function to get employee module access items
export const getEmployeeModuleAccessItems = async (
  employeeId: string
): Promise<ModuleAccessItem[]> => {
  try {
    console.log("Getting module access items for employee:", employeeId);
    
    // Get the employee's module permissions and related module details
    const { data, error } = await supabase
      .from('employee_modules')
      .select(`
        module_id,
        modules:module_id (
          id,
          name,
          level
        )
      `)
      .eq('employee_id', employeeId);
      
    if (error) {
      console.error("Error fetching employee modules:", error);
      throw error;
    }
    
    // Map to ModuleAccessItem format
    return data.map(item => ({
      name: item.modules?.name || '',
      employeeId,
      key: item.modules?.level || item.module_id
    }));
    
  } catch (error) {
    console.error("Error in getEmployeeModuleAccessItems:", error);
    return [];
  }
};
