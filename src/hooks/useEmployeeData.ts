
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setConfiguredModules, setLoading, setError, setClientId } from '@/store/employeeActions';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';
import { useLocation } from 'react-router-dom';

export const useEmployeeData = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state, dispatch } = useEmployeeStore();
  const location = useLocation();

  // Check if we're on a route that needs employee data
  const needsEmployeeData = location.pathname === '/dashboard' || 
                           location.pathname.includes('/employee-verification') ||
                           location.pathname.includes('/settings') ||
                           location.pathname.includes('/assessment') ||
                           location.pathname.includes('/incident') ||
                           location.pathname.includes('/transport') ||
                           location.pathname.includes('/edusafe') ||
                           location.pathname.includes('/grievances');

  // Don't fetch employee data on home page or other non-relevant routes
  const shouldSkipEmployeeData = location.pathname === '/' || 
                                location.pathname === '/login' ||
                                location.pathname === '/pricing' ||
                                location.pathname === '/support' ||
                                location.pathname === '/blog';

  // Fetch configured modules for the employee - now optimized to avoid unnecessary calls
  const fetchConfiguredModules = async (employeeId: string, clientId: string | null) => {
    try {
      dispatch(setLoading(true));
      
      if (!clientId) {
        dispatch(setError("Client ID is missing"));
        return;
      }

      // Set the client ID in Redux store
      dispatch(setClientId(clientId));

      // Check Redux store first - if modules are already loaded, don't fetch again
      if (state.configuredModules && state.configuredModules.length > 0) {
        dispatch(setLoading(false));
        return;
      }

      // Add a minimum loading time to show the spinner
      const minimumLoadingTime = 1500; // 1.5 seconds
      const startTime = Date.now();

      // Check if employee is a super admin
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_super_admin')
        .eq('id', employeeId)
        .maybeSingle();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        dispatch(setError(employeeError.message));
        return;
      }

      const isSuperAdmin = employeeData?.is_super_admin || false;
      
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
          console.error('Error fetching client modules:', clientModulesError);
          dispatch(setError(clientModulesError.message));
          return;
        }

        // Convert client modules to the expected format
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
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
      } else {
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
          console.error('Error fetching client modules:', clientModulesError);
          dispatch(setError(clientModulesError.message));
          return;
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
          console.error('Error fetching employee modules:', employeeModulesError);
          dispatch(setError(employeeModulesError.message));
          return;
        }

        // Create a map of employee module permissions for quick lookup
        const employeeModuleMap = new Map();
        employeeModules?.forEach(em => {
          employeeModuleMap.set(em.module_id, em.level);
        });

        // Combine client modules with employee-specific permissions
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
            return null;
          }
          
          // Check if this module is assigned to the employee
          const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id) || 
                          employeeModules?.length === 0; // If no modules specified, assume access to all
          
          if (!hasAccess && employeeModules?.length > 0) {
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
      }

      // If no modules found, we should at least provide a dashboard
      if (configuredModules.length === 0) {
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

      // Ensure minimum loading time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
      
      setTimeout(() => {
        dispatch(setConfiguredModules(configuredModules));
        dispatch(setLoading(false));
      }, remainingTime);

    } catch (error) {
      console.error('Error in fetchConfiguredModules:', error);
      dispatch(setError("Failed to fetch configured modules"));
      dispatch(setLoading(false));
    }
  };

  // Set employee data from auth context and fetch modules when available
  useEffect(() => {
    // Skip employee data processing on routes that don't need it
    if (shouldSkipEmployeeData) {
      return;
    }

    // Only process employee data if we're on a route that needs it
    if (!needsEmployeeData) {
      return;
    }

    if (authEmployeeData) {
      // Set employee data in Redux store
      dispatch(setEmployeeData(authEmployeeData));
      
      // Set client ID in Redux store
      if (authEmployeeData.clientId) {
        dispatch(setClientId(authEmployeeData.clientId));
      }
      
      // Fetch modules if we have employeeId and clientId
      if (authEmployeeData.id && authEmployeeData.clientId &&
          (!state.configuredModules || state.configuredModules.length === 0)) {
        fetchConfiguredModules(authEmployeeData.id, authEmployeeData.clientId);
      }
    } else {
      // If we have a user but no employee data, try to fetch employee data from the database
      if (user && user.id) {
        const fetchEmployeeDataFromDB = async () => {
          try {
            console.log('Fetching employee data for user:', user.id);
            
            // Try to get employee data by user ID
            const { data, error } = await supabase
              .from('employees')
              .select('id, client_id, first_name, last_name, email, is_super_admin')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching employee data:', error);
              return;
            }
            
            if (data) {
              const employeeData = {
                id: data.id,
                clientId: data.client_id,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                isSuperAdmin: data.is_super_admin
              };
              
              console.log('Found employee data:', employeeData);
              
              // Set employee data in Redux store
              dispatch(setEmployeeData(employeeData));
              
              // Set client ID in Redux store
              if (data.client_id) {
                dispatch(setClientId(data.client_id));
              }
              
              // Fetch modules
              if (data.id && data.client_id) {
                fetchConfiguredModules(data.id, data.client_id);
              }
            } else {
              console.log('No employee data found for user:', user.id);
            }
          } catch (fetchError) {
            console.error('Error in fetchEmployeeDataFromDB:', fetchError);
          }
        };
        
        fetchEmployeeDataFromDB();
      }
    }
  }, [authEmployeeData, user, needsEmployeeData, shouldSkipEmployeeData]);

  return {
    employeeData: state.employeeData,
    configuredModules: state.configuredModules,
    isLoading: state.isLoading,
    error: state.error,
    clientId: state.clientId, // Include clientId in the return value
    refetchModules: () => {
      if (state.employeeData?.id && state.employeeData?.clientId) {
        fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
      }
    }
  };
};
