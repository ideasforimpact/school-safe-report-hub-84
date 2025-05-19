
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

      // First fetch all modules that are enabled for this client
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
      const configuredModules: Module[] = clientModules?.map(cm => {
        const moduleObj = cm.modules;
        return {
          id: moduleObj.id,
          name: moduleObj.name,
          key: moduleObj.level,
          icon: moduleObj.icon,
          enabled: true,
          // Use employee-specific permissions if available, otherwise use client defaults
          accessLevel: employeeModuleMap.has(moduleObj.id) 
            ? employeeModuleMap.get(moduleObj.id) 
            : cm.access_level
        };
      }) || [];

      dispatch(setConfiguredModules(configuredModules));
      console.log("Employee configured modules loaded:", configuredModules);
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
