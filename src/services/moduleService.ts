
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';

export const fetchConfiguredModules = async (employeeId: string, clientId: string | null, isSuperAdmin: boolean): Promise<Module[]> => {
  try {
    if (!clientId) {
      console.error("Client ID is missing, cannot fetch modules");
      return [];
    }
    
    let configuredModules: Module[] = [];
    
    if (isSuperAdmin) {
      console.log("Fetching modules for super admin");
      // For super admins, fetch all modules enabled for the client
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select(`
          id,
          module_id,
          enabled,
          access_level,
          modules(id, name, icon, level, order, url)
        `)
        .eq('client_id', clientId)
        .eq('enabled', true);

      if (clientModulesError) {
        console.error("Error fetching client modules:", clientModulesError);
        return [];
      }

      // Convert client modules to the expected format and sort by order
      configuredModules = clientModules?.map(cm => {
        const moduleObj = cm.modules;
        if (!moduleObj) return null;
        return {
          id: moduleObj.id,
          name: moduleObj.name,
          key: moduleObj.level,
          icon: moduleObj.icon || '',
          level: moduleObj.level,
          enabled: true,
          accessLevel: cm.access_level || {},
          order: moduleObj.order || 999,
          url: moduleObj.url || `/${moduleObj.name.toLowerCase().replace(/\s+/g, '-')}`
        };
      }).filter(Boolean) as Module[] || [];
      
    } else {
      console.log("Fetching modules for regular employee");
      // First fetch all client modules to understand what's available
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select(`
          id,
          module_id,
          enabled,
          access_level,
          modules(id, name, icon, level, order, url)
        `)
        .eq('client_id', clientId)
        .eq('enabled', true);

      if (clientModulesError) {
        console.error("Error fetching client modules for employee:", clientModulesError);
        return [];
      }

      // Then fetch employee-specific module permissions
      const { data: employeeModules, error: employeeModulesError } = await supabase
        .from('employee_modules')
        .select(`
          module_id,
          level
        `)
        .eq('employee_id', employeeId);

      if (employeeModulesError) {
        console.error("Error fetching employee modules:", employeeModulesError);
        return [];
      }

      // Create a map of employee module permissions for quick lookup
      const employeeModuleMap = new Map();
      employeeModules?.forEach(em => {
        employeeModuleMap.set(em.module_id, em.level);
      });

      // Combine client modules with employee-specific permissions
      configuredModules = clientModules?.map(cm => {
        const moduleObj = cm.modules;
        if (!moduleObj) return null;
        
        // Check if this module is assigned to the employee
        const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id) || 
                         employeeModules?.length === 0;
        
        if (!hasAccess && employeeModules?.length > 0) {
          return null;
        }
        
        return {
          id: moduleObj.id,
          name: moduleObj.name,
          key: moduleObj.level,
          icon: moduleObj.icon || '',
          level: moduleObj.level,
          enabled: true,
          accessLevel: employeeModuleMap.get(moduleObj.id) || cm.access_level || {},
          order: moduleObj.order || 999,
          url: moduleObj.url || `/${moduleObj.name.toLowerCase().replace(/\s+/g, '-')}`
        };
      }).filter(Boolean) as Module[] || [];
    }

    // Sort modules by order field (nulls last)
    configuredModules.sort((a, b) => {
      if (a.order === null || a.order === undefined) return 1;
      if (b.order === null || b.order === undefined) return -1;
      return a.order - b.order;
    });

    // If no modules found, provide a dashboard
    if (configuredModules.length === 0) {
      configuredModules = [{
        id: 'dashboard-default',
        name: 'Dashboard',
        key: 'dashboard',
        icon: 'LayoutDashboard',
        level: 'client',
        enabled: true,
        accessLevel: {},
        order: 1,
        url: '/dashboard'
      }];
    }
    
    console.log("Modules fetched:", configuredModules.length);
    return configuredModules;
    
  } catch (error) {
    console.error("Error in fetchConfiguredModules:", error);
    return [];
  }
};
