
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSaasOwnerItems, 
  getClientItems, 
  fetchModules, 
  convertModulesToSidebarItems 
} from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import ClientModulesList from './ClientModulesList';
import { ModulePermissions } from '@/contexts/auth/types';
import { toast } from 'sonner';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSaasOwner, isAdmin, employeeData } = useAuth();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchPath, setLastFetchPath] = useState('');
  
  // Check if employee data indicates super admin status
  const isSuperAdmin = employeeData?.isSuperAdmin === true;
  
  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
  console.log("AUTH DETAILS:", {
    email: user?.email,
    provider: user?.provider || 'none',
    isProviderAuthenticated,
    isBackofficeRoute,
    isSaasOwner,
    isSuperAdmin
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isSaasOwner && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isSaasOwner, user, location.pathname, navigate]);
  
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
      console.log(`User is ${isSaasOwner ? 'SaaS owner' : 'client user'}, route is ${isBackofficeRoute ? 'backoffice' : 'client'}`);
      console.log(`User authenticated via provider: ${user?.provider || 'none'}, will show ${user?.provider ? 'configured' : 'all'} modules`);
      
      // If this is a provider-authenticated user on client side, we'll use the ClientModulesList
      // component instead of continuing with this function
      if (isProviderAuthenticated && !isBackofficeFetch) {
        console.log("Using ClientModulesList for provider-authenticated user:", user?.email);
        setIsLoading(false);
        setLastFetchPath(isBackofficeRoute ? 'backoffice' : 'client');
        return;
      }
      
      // Fetch modules passing user info and employee data from context
      const modules = await fetchModules(isBackofficeFetch, user, employeeData);
      
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
        
        // If user is authenticated via provider (Google, etc.), filter modules based on permissions
        let items = [];
        
        if (user?.provider) {
          // For provider-authenticated users, only show modules they have permission for
          const filteredModules = modules.filter(module => {
            // Super admins can see all modules
            if (isSuperAdmin) return true;
            
            const moduleKey = module.key;
            // If the module has a key and matches a permission key that is enabled, show it
            return moduleKey && user?.modulePermissions?.[moduleKey as keyof ModulePermissions];
          });
          
          items = convertModulesToSidebarItems(filteredModules, user?.modulePermissions || {}, basePath);
        } else {
          // For regular users, use standard conversion
          items = convertModulesToSidebarItems(modules, user?.modulePermissions || {}, basePath);
        }
        
        setDynamicMenuItems(items);
      }
      
      // Update the last fetch path to prevent duplicate fetches
      setLastFetchPath(isBackofficeRoute ? 'backoffice' : 'client');
    } catch (error) {
      console.error('Error loading modules:', error);
      // Fall back to static configuration if fetching fails
      const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
        getSaasOwnerItems() : getClientItems(user?.modulePermissions || {});
      setDynamicMenuItems(fallbackItems);
      
      // Notify user of the error
      toast.error("Could not load menu items. Using fallback configuration.");
    } finally {
      setIsLoading(false);
    }
  }, [isSaasOwner, isBackofficeRoute, lastFetchPath, user, isProviderAuthenticated, employeeData, isSuperAdmin]);

  // Fetch modules only when user is authenticated
  useEffect(() => {
    if (user) {
      // Use requestAnimationFrame to ensure DOM is rendered first
      requestAnimationFrame(() => {
        loadModules();
      });
    }
  }, [user, loadModules]);

  // Get appropriate items based on user role and route
  const menuItems = dynamicMenuItems.length > 0 
    ? dynamicMenuItems 
    : (isSaasOwner && isBackofficeRoute) 
      ? getSaasOwnerItems() 
      : getClientItems(user?.modulePermissions || {});

  // Determine if a path is active, and add '/backoffice' prefix for SaaS owners
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

  // For provider-authenticated users on client routes, use the dedicated component
  if (isProviderAuthenticated && !isBackofficeRoute) {
    console.log("Using ClientModulesList for provider-authenticated user:", user?.email);
    return <ClientModulesList />;
  }

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
                path={getProcessedPath(item.path)}
                isActive={isActive(getProcessedPath(item.path))}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
