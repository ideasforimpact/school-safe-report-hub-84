
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSaasOwnerItems, getClientItems, fetchModules, convertModulesToSidebarItems } from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import { ModulePermissions } from '@/contexts/auth/types';
import { toast } from 'sonner';

const SidebarContent = () => {
  const location = useLocation();
  const { user, isSaasOwner, isAdmin } = useAuth();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchPath, setLastFetchPath] = useState('');
  
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
  
  // Memoize the loadModules function to prevent unnecessary re-renders
  const loadModules = useCallback(async () => {
    // Skip if the path hasn't changed since last fetch
    if (lastFetchPath === (isBackofficeRoute ? 'backoffice' : 'client')) {
      return;
    }

    setIsLoading(true);
    
    try {
      // For SaaS users in backoffice route, fetch backoffice modules
      // For others, fetch client modules
      const isBackofficeFetch = isSaasOwner && isBackofficeRoute;
      const level = isBackofficeFetch ? 'backoffice' : 'client';
      console.log(`Fetching ${level} modules`);
      
      // Fetch modules based on the user type and route, passing user info
      const modules = await fetchModules(isBackofficeFetch, user);
      
      if (modules.length === 0 && !user) {
        // If no modules and no user, only show dashboard
        setDynamicMenuItems([{
          icon: null,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true
        }]);
      } else {
        const basePath = isBackofficeFetch ? '/backoffice' : '';
        const items = convertModulesToSidebarItems(modules, effectivePermissions, basePath);
        setDynamicMenuItems(items);
      }
      
      // Update the last fetch path to prevent duplicate fetches
      setLastFetchPath(isBackofficeRoute ? 'backoffice' : 'client');
    } catch (error) {
      console.error('Error loading modules:', error);
      // Fall back to static configuration if fetching fails
      const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
        getSaasOwnerItems() : getClientItems(effectivePermissions);
      setDynamicMenuItems(fallbackItems);
      
      // Notify user of the error
      toast.error("Could not load menu items. Using fallback configuration.");
    } finally {
      setIsLoading(false);
    }
  }, [isSaasOwner, isBackofficeRoute, effectivePermissions, lastFetchPath, user]);

  // Fetch modules only when relevant dependencies change
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Use dynamic menu items if available, otherwise fall back to static config
  const menuItems = dynamicMenuItems.length > 0 
    ? dynamicMenuItems 
    : (isSaasOwner && isBackofficeRoute) 
      ? getSaasOwnerItems() 
      : getClientItems(effectivePermissions);

  const isActive = (path: string) => {
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
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
          {menuItems
            .filter(item => item.allowed)
            .map((item) => (
              <SidebarMenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={isActive(item.path)}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
