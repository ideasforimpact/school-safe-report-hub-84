
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchModules,
  convertModulesToSidebarItems
} from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import ClientModulesList from './ClientModulesList';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getConfiguredModules } from '@/store/employeeSelectors';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSaasOwner } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const configuredModules = getConfiguredModules(employeeState);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
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
  
  // Use cached modules from Redux store instead of fetching every time
  useEffect(() => {
    // Skip if already initialized to prevent re-fetching
    if (hasInitialized) {
      return;
    }
    
    console.log('SidebarContent Debug:', {
      isSaasOwner,
      isBackofficeRoute,
      configuredModulesLength: configuredModules.length,
      userRole: user?.role,
      pathname: location.pathname
    });
    
    setIsLoading(true);
    
    try {
      // PRIORITY 1: Backoffice users - use cached modules from Redux store
      if (isBackofficeRoute && configuredModules.length > 0) {
        console.log('Using cached backoffice modules for sidebar:', configuredModules.length);
        const items = convertModulesToSidebarItems(configuredModules, {}, '/backoffice');
        setDynamicMenuItems(items);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }
      
      // PRIORITY 2: Provider-authenticated users on client routes - use ClientModulesList
      if (isProviderAuthenticated && !isBackofficeRoute) {
        // ClientModulesList component will handle this case
        setHasInitialized(true);
        setIsLoading(false);
        return;
      }
      
      // PRIORITY 3: Regular client users with configured modules from Redux store
      if (configuredModules.length > 0) {
        // Convert Redux store modules to sidebar format
        const items = configuredModules.map(module => {
          const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
          return {
            icon: module.icon || 'LayoutDashboard',
            label: module.name,
            path,
            allowed: true,
            accessLevel: module.accessLevel || {}
          };
        });
        
        setDynamicMenuItems(items);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }
      
      // PRIORITY 4: Fallback - show loading or empty state
      // Only fetch from API if no cached modules available
      if (!user || !configuredModules || configuredModules.length === 0) {
        const loadModulesFromAPI = async () => {
          try {
            const modules = await fetchModules(isBackofficeRoute, user);
            const basePath = isBackofficeRoute ? '/backoffice' : '';
            const items = convertModulesToSidebarItems(modules, {}, basePath);
            setDynamicMenuItems(items);
          } catch (error) {
            console.error('Error loading modules from API:', error);
            setDynamicMenuItems([]);
          } finally {
            setIsLoading(false);
            setHasInitialized(true);
          }
        };
        
        loadModulesFromAPI();
        return;
      }
      
      setIsLoading(false);
      setHasInitialized(true);
      
    } catch (error) {
      console.error('Error processing cached modules:', error);
      setDynamicMenuItems([]);
      setIsLoading(false);
      setHasInitialized(true);
    }
    
  }, [isSaasOwner, isBackofficeRoute, user, isProviderAuthenticated, configuredModules, hasInitialized]);

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
    <div className="flex-1 min-h-0 py-6 pr-1">
      <nav className="px-2 pb-6">
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
                accessLevel={item.accessLevel}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
