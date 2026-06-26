import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setConfiguredModules, setLoading, setError, setClientId } from '@/store/employeeActions';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';
import { useLocation } from 'react-router-dom';
import { loadAuthState } from '@/store/authPersistence';

export const useEmployeeData = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state, dispatch } = useEmployeeStore();
  const location = useLocation();
  
  // Use refs to track operation states and prevent multiple simultaneous operations
  const isInitializedRef = useRef(false);
  const isFetchingModulesRef = useRef(false);
  const isFetchingEmployeeDataRef = useRef(false);

  // Memoize computed values to prevent re-renders
  const needsEmployeeData = useMemo(() => {
    return location.pathname === '/dashboard' || 
           location.pathname.includes('/employee-verification') ||
           location.pathname.includes('/settings') ||
           location.pathname.includes('/assessment') ||
           location.pathname.includes('/incident') ||
           location.pathname.includes('/transport') ||
           location.pathname.includes('/edusafe') ||
           location.pathname.includes('/grievances') ||
           location.pathname.includes('/committees');
  }, [location.pathname]);

  const shouldSkipEmployeeData = useMemo(() => {
    return location.pathname === '/' || 
           location.pathname === '/home' ||
           location.pathname === '/login' ||
           location.pathname === '/pricing' ||
           location.pathname === '/support' ||
           location.pathname === '/blog';
  }, [location.pathname]);

  // Reset function to clear initialization
  const resetInitialization = useCallback(() => {
    isInitializedRef.current = false;
    isFetchingModulesRef.current = false;
    isFetchingEmployeeDataRef.current = false;
  }, []);

  // Memoize the configured modules fetching function - ALWAYS FETCH FRESH
  const fetchConfiguredModules = useCallback(async (employeeId: string, clientId: string | null) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingModulesRef.current || shouldSkipEmployeeData) {
      return;
    }

    try {
      isFetchingModulesRef.current = true;

      dispatch(setLoading(true));
      
      if (!clientId) {
        dispatch(setError("Client ID is missing"));
        return;
      }

      // Set the client ID in Redux store
      dispatch(setClientId(clientId));

      // Check if employee is a super admin
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_super_admin')
        .eq('id', employeeId)
        .maybeSingle();

      if (employeeError) {
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

      dispatch(setConfiguredModules(configuredModules));
      dispatch(setLoading(false));

    } catch (error) {
      dispatch(setError("Failed to fetch configured modules"));
      dispatch(setLoading(false));
    } finally {
      isFetchingModulesRef.current = false;
    }
  }, [shouldSkipEmployeeData, dispatch]);

  // Memoize the employee data fetching function
  const fetchEmployeeDataFromDB = useCallback(async (userId: string) => {
    if (isFetchingEmployeeDataRef.current || shouldSkipEmployeeData) {
      return;
    }

    try {
      isFetchingEmployeeDataRef.current = true;

      // Feature 4 (C-1 fix): scope the lookup to the user's active client.
      // Multi-client users have N employees rows with the same user_id —
      // without this scope, .maybeSingle() picks one non-deterministically
      // and downstream Redux/dashboard state ends up pointing at the wrong
      // client. JWT app_metadata.client_id is the authoritative source
      // (stamped by set_active_client_for_login on every login); we fall
      // back to Redux state.activeClientId / state.clientId if for some
      // reason the JWT hasn't been stamped yet (e.g. legacy session).
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const jwtClientId =
        (currentSession?.user?.app_metadata as Record<string, unknown> | undefined)?.client_id as string | undefined;
      const activeClientId =
        jwtClientId
        ?? (state.activeClientId as string | undefined)
        ?? (state.clientId as string | undefined)
        ?? null;

      let query = supabase
        .from('employees')
        .select('id, client_id, first_name, last_name, email, is_super_admin')
        .eq('user_id', userId);
      if (activeClientId) {
        query = query.eq('client_id', activeClientId);
      }
      const { data, error } = await query.maybeSingle();
        
      if (error) {
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
        
        dispatch(setEmployeeData(employeeData));
        
        if (data.client_id) {
          dispatch(setClientId(data.client_id));
        }
        
        // Always fetch fresh modules after login
        if (data.id && data.client_id && !isFetchingModulesRef.current) {
          await fetchConfiguredModules(data.id, data.client_id);
        }
      }
    } catch (fetchError) {
      // Handle error silently
    } finally {
      isFetchingEmployeeDataRef.current = false;
    }
  }, [shouldSkipEmployeeData, dispatch, fetchConfiguredModules, state.activeClientId, state.clientId]);

  // Main effect for setting employee data from auth context
  useEffect(() => {
    // Skip employee data processing on routes that don't need it
    if (shouldSkipEmployeeData) {
      return;
    }

    // Only process employee data if we're on a route that needs it
    if (!needsEmployeeData) {
      return;
    }

    // Skip if already initialized
    if (isInitializedRef.current) {
      return;
    }

    if (authEmployeeData) {
      // Set employee data in Redux store
      dispatch(setEmployeeData(authEmployeeData));
      
      // Set client ID in Redux store
      if (authEmployeeData.clientId) {
        dispatch(setClientId(authEmployeeData.clientId));
      }
      
      // Always fetch fresh modules after authentication
      if (authEmployeeData.id && authEmployeeData.clientId && !isFetchingModulesRef.current) {
        fetchConfiguredModules(authEmployeeData.id, authEmployeeData.clientId);
      }
      
      isInitializedRef.current = true;
    } else if (user && user.id && !isFetchingEmployeeDataRef.current) {
      // If we have a user but no employee data, try to fetch employee data from the database
      fetchEmployeeDataFromDB(user.id);
      isInitializedRef.current = true;
    }
  }, [
    authEmployeeData, 
    user, 
    needsEmployeeData, 
    shouldSkipEmployeeData, 
    dispatch, 
    fetchConfiguredModules, 
    fetchEmployeeDataFromDB,
    state.configuredModules
  ]);

  // Reset initialization flag when route changes to non-employee routes
  useEffect(() => {
    if (shouldSkipEmployeeData) {
      isInitializedRef.current = false;
      isFetchingModulesRef.current = false;
      isFetchingEmployeeDataRef.current = false;
    }
  }, [shouldSkipEmployeeData]);

  const refetchModules = useCallback(() => {
    if (!shouldSkipEmployeeData && state.employeeData?.id && state.employeeData?.clientId && !isFetchingModulesRef.current) {
      fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
    }
  }, [shouldSkipEmployeeData, state.employeeData?.id, state.employeeData?.clientId, fetchConfiguredModules]);

  return {
    employeeData: state.employeeData,
    configuredModules: state.configuredModules,
    isLoading: state.isLoading,
    error: state.error,
    clientId: state.clientId,
    refetchModules,
    resetInitialization
  };
};
