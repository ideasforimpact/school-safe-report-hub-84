
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

  // Fetch configured modules for the employee
  const fetchConfiguredModules = async (employeeId: string, clientId: string | null) => {
    try {
      dispatch(setLoading(true));
      
      if (!clientId) {
        dispatch(setError("Client ID is missing"));
        return;
      }

      // Set the client ID in Redux store
      dispatch(setClientId(clientId));

      console.log("Fetching modules for employee:", employeeId, "client:", clientId);

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
            modules(id, name, icon, level, order, url)
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

      // Sort modules by order field
      configuredModules.sort((a, b) => {
        if (a.order === null || a.order === undefined) return 1;
        if (b.order === null || b.order === undefined) return -1;
        return a.order - b.order;
      });

      // If no modules found, we should at least provide a dashboard
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

      console.log("Setting configured modules:", configuredModules);
      dispatch(setConfiguredModules(configuredModules));
      dispatch(setLoading(false));

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
      
      // Always fetch modules if we have employeeId and clientId - even if they exist in state
      // This ensures fresh data and resolves the DevTools refresh issue
      if (authEmployeeData.id && authEmployeeData.clientId) {
        console.log("Employee data available, fetching modules");
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
                console.log("Fetched employee data, fetching modules");
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

  // Additional effect to handle when configuredModules are empty but we have employee data
  useEffect(() => {
    // If we have employee data but no modules, and we're on a route that needs them, fetch modules
    if (state.employeeData && 
        (!state.configuredModules || state.configuredModules.length === 0) &&
        needsEmployeeData && !shouldSkipEmployeeData &&
        !state.isLoading) {
      console.log("Employee data exists but modules missing, re-fetching");
      if (state.employeeData.id && state.employeeData.clientId) {
        fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
      }
    }
  }, [state.employeeData, state.configuredModules, needsEmployeeData, shouldSkipEmployeeData, state.isLoading]);

  return {
    employeeData: state.employeeData,
    configuredModules: state.configuredModules,
    isLoading: state.isLoading,
    error: state.error,
    clientId: state.clientId,
    refetchModules: () => {
      if (state.employeeData?.id && state.employeeData?.clientId) {
        fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
      }
    }
  };
};
