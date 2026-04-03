import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { setConfiguredModules } from '@/store/employeeActions';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to sync module access in real-time when changes occur
 * This ensures that when a Super Admin modifies an employee's module access,
 * the employee's session is immediately updated without requiring a refresh
 */
export const useRealtimeModuleSync = () => {
  const { state, dispatch } = useEmployeeStore();
  const { getEmployeeId, getClientId } = useEmployeeAccess();
  
  // Toast deduplication: prevent multiple identical toasts within 5 seconds
  const lastToastTimeRef = useRef<number>(0);
  const previousModuleListSignatureRef = useRef<string | null>(null);
  const TOAST_DEBOUNCE_MS = 5000; // 5 seconds
  const navigate = useNavigate();
  const location = useLocation();
  const refreshModules = useCallback(async () => {
    const employeeId = getEmployeeId();
    const clientId = getClientId();
    const normalize = (p: string) => p.toLowerCase().replace(/\/+$/, '');
    if (!employeeId || !clientId) {
      return;
    }

    try {
      // Check if employee is a super admin
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_super_admin')
        .eq('id', employeeId)
        .maybeSingle();

      if (employeeError) {
        console.error('Error fetching employee data for module sync:', employeeError);
        return;
      }

      const isSuperAdmin = employeeData?.is_super_admin || false;
      
      let configuredModules: any[] = [];
      
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
          console.error('Error fetching client modules for sync:', clientModulesError);
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
        }).filter(Boolean) || [];
        
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
          console.error('Error fetching client modules for sync:', clientModulesError);
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
          console.error('Error fetching employee modules for sync:', employeeModulesError);
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
          const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id);
          
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
        }).filter(Boolean) || [];
      }

      // Sort modules by order field
      configuredModules.sort((a, b) => {
        if (a.order === null || a.order === undefined) return 1;
        if (b.order === null || b.order === undefined) return -1;
        return a.order - b.order;
      });
      const currentModuleListSignature = configuredModules
        .map(m => String(m.id))
        .sort()
        .join('|');
      const hadPreviousModuleList = previousModuleListSignatureRef.current !== null;
      const moduleListChanged =
        hadPreviousModuleList &&
        previousModuleListSignatureRef.current !== currentModuleListSignature;
      previousModuleListSignatureRef.current = currentModuleListSignature;

      // Update the configured modules in Redux store
      dispatch(setConfiguredModules(configuredModules));
      const currentPath = normalize(location.pathname);

      if (currentPath.startsWith('/backoffice')) return;

      if (configuredModules.length === 0) return;

      const enabledUrls = configuredModules
        .filter(m => m.enabled && m.url)
        .map(m => normalize(m.url));

      if (enabledUrls.length === 0) return;

      const isAllowed = enabledUrls.some(url =>
        currentPath.startsWith(url)
      );

      if (!isAllowed) {
        const redirectTarget = enabledUrls[0];
        console.warn(
          'Realtime module disabled → redirecting to:',
          redirectTarget
        );
        navigate(redirectTarget, { replace: true });
      }
      if (moduleListChanged) {
        // Show toast notification with deduplication - only if enough time has passed
        const currentTime = Date.now();
        if (currentTime - lastToastTimeRef.current > TOAST_DEBOUNCE_MS) {
          lastToastTimeRef.current = currentTime;
          toast.info('New module assigned', {
            description: 'A new module has been assigned to your organization. Your module list has been updated.',
          });
        }
      }

    } catch (error) {
      console.error('Error refreshing modules:', error);
    }
  }, [getEmployeeId, getClientId, dispatch]);

  useEffect(() => {
    const employeeId = getEmployeeId();
    const clientId = getClientId();
    
    if (!employeeId || !clientId) {
      return;
    }

    // Subscribe to changes in the employee_modules table for this specific employee
    const employeeChannel = supabase
      .channel('employee-module-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employee_modules',
          filter: `employee_id=eq.${employeeId}`
        },
        (payload) => {
          console.log('Employee module change detected:', payload);
          // Refresh modules when changes are detected
          refreshModules();
        }
      )
      .subscribe();

    // Subscribe to changes in the client_modules table for this client
    // This ensures that when a new module is assigned to the client, all employees get notified
    const clientChannel = supabase
      .channel('client-module-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'client_modules',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Client module change detected:', payload);
          // Refresh modules when changes are detected at client level
          refreshModules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(clientChannel);
    };
  }, [getEmployeeId, getClientId, refreshModules]);

  return {
    refreshModules
  };
};