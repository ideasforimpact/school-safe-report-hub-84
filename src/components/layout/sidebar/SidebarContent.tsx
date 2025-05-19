
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { Module as StoreModule } from '@/store/types';
import { Module as SidebarModule } from './sidebarConfig';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSaasOwner, isAdmin, employeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchPath, setLastFetchPath] = useState('');
  
  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
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
      
      // If this is a provider-authenticated user on client side, we'll use the ClientModulesList
      // component instead of continuing with this function
      if (isProviderAuthenticated && !isBackofficeFetch) {
        setIsLoading(false);
        setLastFetchPath(isBackofficeRoute ? 'backoffice' : 'client');
        return;
      }
      
      // Use modules from the employee store if available
      if (employeeState.configuredModules.length > 0 && !isBackofficeFetch) {
        const basePath = '';
        
        // Convert store modules to sidebar modules format
        const sidebarModules: SidebarModule[] = employeeState.configuredModules.map((module: StoreModule) => ({
          id: module.id,
          name: module.name,
          icon: module.icon || '',
          level: module.level || '',
          key: module.key,
          access_level: {},
        }));
        
        console.log("Converting modules for sidebar:", sidebarModules);
        
        const items = convertModulesToSidebarItems(
          sidebarModules,
          {}, // We don't need module permissions anymore
          basePath
        );
        
        setDynamicMenuItems(items);
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
        
        // For all users, convert modules directly without filtering based on permissions
        const items = convertModulesToSidebarItems(modules, {}, basePath);
        setDynamicMenuItems(items);
      }
      
      // Update the last fetch path to prevent duplicate fetches
      setLastFetchPath(isBackofficeRoute ? 'backoffice' : 'client');
    } catch (error) {
      console.error('Error loading modules:', error);
      // Fall back to static configuration if fetching fails
      const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
        getSaasOwnerItems() : getClientItems({});
      setDynamicMenuItems(fallbackItems);
    } finally {
      setIsLoading(false);
    }
  }, [isSaasOwner, isBackofficeRoute, lastFetchPath, user, isProviderAuthenticated, employeeData, employeeState.configuredModules]);

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
      : getClientItems({});

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
