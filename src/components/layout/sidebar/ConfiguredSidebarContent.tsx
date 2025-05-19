
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { convertModulesToSidebarItems } from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import { ModulePermissions } from '@/contexts/auth/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ConfiguredSidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSaasOwner, isAdmin } = useAuth();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user permissions with default fallback
  const defaultPermissions: ModulePermissions = {
    superAdmin: false,
    incidentReporting: true,
    incidentAdmin: false,
    assessmentUser: true,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: true
  };
  
  const permissions: ModulePermissions = user?.modulePermissions || defaultPermissions;

  // For admin users, we want to show all modules regardless of specific permissions
  const effectivePermissions = isAdmin ? 
    {
      ...permissions,
      incidentReporting: true,
      incidentAdmin: true,
      assessmentUser: true,
      assessmentsAdmin: true,
      employeeVerificationAdmin: true,
      grievancesAdmin: true,
      transportSafetyAdmin: true,
      eduSafeResourceAccess: true
    } : permissions;

  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isSaasOwner && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isSaasOwner, user, location.pathname, navigate]);
  
  // Function to fetch configured modules for the current user from Supabase
  const fetchConfiguredModules = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // For authenticated users, prioritize fetching modules from the client-modules table
      if (user.clientId) {
        console.log(`Fetching configured modules for client: ${user.clientId}`);
        
        const { data: clientModules, error: clientError } = await supabase
          .from('client_modules')
          .select('module_id, access_level')
          .eq('client_id', user.clientId);
          
        if (clientError) {
          console.error('Error fetching client modules:', clientError);
          throw clientError;
        }
        
        if (clientModules && clientModules.length > 0) {
          const moduleIds = clientModules.map(cm => cm.module_id);
          
          // Fetch the actual module details
          const { data: moduleDetails, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .in('id', moduleIds);
            
          if (modulesError) {
            console.error('Error fetching module details:', modulesError);
            throw modulesError;
          }
          
          if (moduleDetails && moduleDetails.length > 0) {
            // Combine module details with access levels
            const configuredModules = moduleDetails.map(module => {
              const clientModule = clientModules.find(cm => cm.module_id === module.id);
              return {
                ...module,
                access_level: clientModule?.access_level || { isEnabled: true }
              };
            });
            
            // Filter out disabled modules
            const enabledModules = configuredModules.filter(
              module => module.access_level && module.access_level.isEnabled !== false
            );
            
            console.log(`Found ${enabledModules.length} configured modules for client ${user.clientId}`);
            
            // Generate sidebar items from the modules
            const basePath = isBackofficeRoute ? '/backoffice' : '';
            const items = convertModulesToSidebarItems(enabledModules, effectivePermissions, basePath);
            setDynamicMenuItems(items);
          }
        } else {
          console.log('No configured modules found for client');
          setDynamicMenuItems([]);
        }
      } else if (user.modules && user.modules.length > 0) {
        // Fallback to modules from user object if available
        console.log(`Using ${user.modules.length} modules from user object`);
        const basePath = isBackofficeRoute ? '/backoffice' : '';
        const items = convertModulesToSidebarItems(user.modules, effectivePermissions, basePath);
        setDynamicMenuItems(items);
      } else {
        console.log('No modules found for user');
        setDynamicMenuItems([]);
      }
    } catch (error) {
      console.error('Error loading configured modules:', error);
      toast.error("Could not load menu items");
      setDynamicMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isBackofficeRoute, effectivePermissions]);

  // Fetch configured modules when component mounts or user changes
  useEffect(() => {
    fetchConfiguredModules();
  }, [fetchConfiguredModules, user?.id, user?.clientId]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const activePath = path;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === activePath || (activePath !== '/' && currentPath.startsWith(activePath));
  };

  // Process paths for SaaS owners - add /backoffice prefix if not already present
  const getProcessedPath = (path: string) => {
    // If user is SaaS owner and path doesn't already start with /backoffice, add it
    if (isSaasOwner && user?.role === 'saas_owner') {
      if (path === '/') {
        return '/backoffice';
      }
      return path.startsWith('/backoffice') ? path : `/backoffice${path}`;
    }
    return path;
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-6 text-white flex justify-center items-center">
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 py-6">
      <nav className="px-2">
        <ul className="space-y-5">
          {dynamicMenuItems
            .filter(item => item.allowed)
            .map((item) => (
              <SidebarMenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={getProcessedPath(item.path)}
                isActive={isActive(getProcessedPath(item.path))}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default ConfiguredSidebarContent;
