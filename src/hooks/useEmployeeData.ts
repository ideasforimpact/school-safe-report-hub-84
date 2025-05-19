
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setConfiguredModules, setLoading, setError } from '@/store/employeeActions';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';

export const useEmployeeData = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state, dispatch } = useEmployeeStore();

  // Fetch configured modules for the employee
  const fetchConfiguredModules = async (employeeId: string, clientId: string | null) => {
    try {
      dispatch(setLoading(true));
      
      if (!clientId) {
        console.error("Client ID is missing, cannot fetch modules");
        dispatch(setError("Client ID is missing"));
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

        // Convert client modules to the expected format
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level,
            icon: moduleObj.icon,
            level: moduleObj.level, // Include the level property
            enabled: true,
            // Convert any JSON to a standard empty object if needed
            accessLevel: {}
          };
        }) || [];
        
        console.log("Super admin modules loaded:", configuredModules);
      } else {
        // For regular employees, first fetch all modules that are enabled for this client
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

        // Create a map of employee module permissions for quick lookup
        const employeeModuleMap = new Map();
        employeeModules?.forEach(em => {
          employeeModuleMap.set(em.module_id, em.access_level);
        });

        // Combine client modules with employee-specific permissions
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level,
            icon: moduleObj.icon,
            level: moduleObj.level, // Include the level property
            enabled: true,
            // Use employee-specific permissions if available, otherwise use client defaults,
            // but ensure it's converted to an object, not passed as JSON
            accessLevel: {}
          };
        }) || [];
        
        console.log("Regular employee modules loaded:", configuredModules);
      }

      dispatch(setConfiguredModules(configuredModules));
      console.log("Total configured modules loaded:", configuredModules.length);
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
      console.log("Employee data loaded in store:", authEmployeeData);
      
      // Fetch modules if we have employeeId and clientId
      if (authEmployeeData.id && authEmployeeData.clientId) {
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
