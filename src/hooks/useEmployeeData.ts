
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setConfiguredModules, setLoading, setError } from '@/store/employeeActions';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';

export const useEmployeeData = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state, dispatch } = useEmployeeStore();

  // Fetch configured modules for the employee - now optimized to avoid unnecessary calls
  const fetchConfiguredModules = async (employeeId: string, clientId: string | null) => {
    try {
      console.log("Starting fetchConfiguredModules with:", { employeeId, clientId });
      dispatch(setLoading(true));
      
      if (!clientId) {
        console.error("Client ID is missing, cannot fetch modules");
        dispatch(setError("Client ID is missing"));
        return;
      }

      // Check Redux store first - if modules are already loaded, don't fetch again
      if (state.configuredModules && state.configuredModules.length > 0) {
        console.log("Modules already in Redux store, skipping fetch");
        dispatch(setLoading(false));
        return;
      }

      // Check if employee is a super admin
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_super_admin')
        .eq('id', employeeId)
        .single();

      if (employeeError) {
        console.error("Error fetching employee data:", employeeError);
        dispatch(setError(employeeError.message));
        return;
      }

      const isSuperAdmin = employeeData?.is_super_admin || false;
      console.log("Employee is super admin:", isSuperAdmin);
      
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
            modules(id, name, icon, level)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error("Error fetching client modules:", clientModulesError);
          dispatch(setError(clientModulesError.message));
          return;
        }

        console.log("Client modules raw data:", clientModules);

        // Convert client modules to the expected format
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
            console.warn("Missing module object in client module:", cm);
            return null;
          }
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level, // Using level as key
            icon: moduleObj.icon || '',
            level: moduleObj.level, // Include the level property
            enabled: true,
            accessLevel: cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
        
        console.log("Super admin modules loaded:", configuredModules);
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
            modules(id, name, icon, level)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error("Error fetching client modules for regular employee:", clientModulesError);
          dispatch(setError(clientModulesError.message));
          return;
        }

        console.log("Client modules available to the employee:", clientModules);

        // Then fetch employee-specific module permissions
        const { data: employeeModules, error: employeeModulesError } = await supabase
          .from('employee_modules')
          .select(`
            module_id,
            access_level
          `)
          .eq('employee_id', employeeId);

        if (employeeModulesError) {
          console.error("Error fetching employee modules:", employeeModulesError);
          dispatch(setError(employeeModulesError.message));
          return;
        }

        console.log("Employee-specific modules:", employeeModules);

        // Create a map of employee module permissions for quick lookup
        const employeeModuleMap = new Map();
        employeeModules?.forEach(em => {
          employeeModuleMap.set(em.module_id, em.access_level);
        });

        // Combine client modules with employee-specific permissions
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
            console.warn("Missing module object in client module for employee:", cm);
            return null;
          }
          
          // Check if this module is assigned to the employee
          const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id) || 
                           employeeModules?.length === 0; // If no modules specified, assume access to all
          
          if (!hasAccess && employeeModules?.length > 0) {
            console.log(`Employee doesn't have access to module: ${moduleObj.name}`);
            return null;
          }
          
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level, // Using level as key
            icon: moduleObj.icon || '',
            level: moduleObj.level, // Include the level property
            enabled: true,
            accessLevel: employeeModuleMap.get(moduleObj.id) || cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
        
        console.log("Regular employee modules loaded:", configuredModules);
      }

      // If no modules found, we should at least provide a dashboard
      if (configuredModules.length === 0) {
        console.log("No modules found, adding default dashboard");
        configuredModules = [{
          id: 'dashboard-default',
          name: 'Dashboard',
          key: 'dashboard',
          icon: 'LayoutDashboard',
          level: 'client',
          enabled: true,
          accessLevel: {}
        }];
      }

      dispatch(setConfiguredModules(configuredModules));
      console.log("Total configured modules stored in Redux:", configuredModules.length);
    } catch (error) {
      console.error("Error in fetchConfiguredModules:", error);
      dispatch(setError("Failed to fetch configured modules"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Set employee data from auth context and fetch modules when available
  useEffect(() => {
    if (authEmployeeData) {
      dispatch(setEmployeeData(authEmployeeData));
      console.log("Employee data loaded in Redux store:", authEmployeeData);
      
      // Fetch modules if we have employeeId and clientId and there are no modules in the store
      if (authEmployeeData.id && authEmployeeData.clientId && 
          (!state.configuredModules || state.configuredModules.length === 0)) {
        fetchConfiguredModules(authEmployeeData.id, authEmployeeData.clientId);
      }
    }
  }, [authEmployeeData]);

  return {
    employeeData: state.employeeData,
    configuredModules: state.configuredModules,
    isLoading: state.isLoading,
    error: state.error,
    refetchModules: () => {
      if (state.employeeData?.id && state.employeeData?.clientId) {
        fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
      }
    }
  };
};
