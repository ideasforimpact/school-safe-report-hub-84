
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
  
  // Fetch modules dynamically
  useEffect(() => {
    if (isProviderAuthenticated && !isBackofficeRoute) {
      // Use ClientModulesList component for provider-authenticated users
      return;
    }
    
    setIsLoading(true);
    
    const loadModules = async () => {
      try {
        if (isSaasOwner && isBackofficeRoute) {
          // For backoffice, fetch modules from database
          console.log('Loading backoffice modules from database');
          const modules = await fetchModules(true, user);
          const items = convertModulesToSidebarItems(modules, {}, '/backoffice');
          setDynamicMenuItems(items);
        } else if (configuredModules.length > 0) {
          // Convert Redux store modules to sidebar format - use exact URLs and order
          const items = configuredModules
            .sort((a, b) => {
              // Sort by order field (nulls last)
              if (a.order === null || a.order === undefined) return 1;
              if (b.order === null || b.order === undefined) return -1;
              return a.order - b.order;
            })
            .map(module => ({
              icon: null, // Will be resolved in ClientModulesList
              label: module.name,
              path: module.url || `/${module.name.toLowerCase().replace(/\s+/g, '-')}`, // Use exact URL from database
              allowed: true,
              order: module.order
            }));
          
          setDynamicMenuItems(items);
        } else {
          // Fallback to API call for client modules
          const modules = await fetchModules(false, user);
          const items = convertModulesToSidebarItems(modules, {});
          setDynamicMenuItems(items);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
        setDynamicMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModules();
    
  }, [isSaasOwner, isBackofficeRoute, user, isProviderAuthenticated, configuredModules]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // Process paths - avoid double prefixes
  const getProcessedPath = (path: string) => {
    // If path already starts with /backoffice, don't add another prefix
    if (path.startsWith('/backoffice')) {
      return path;
    }
    
    // If user is SaaS owner and we're in backoffice route, add /backoffice prefix
    if (isSaasOwner && user?.role === 'saas_owner' && isBackofficeRoute) {
      if (path === '/') {
        return '/backoffice';
      }
      return `/backoffice${path}`;
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
          {dynamicMenuItems
            .filter(item => item.allowed)
            .map((item) => (
              <SidebarMenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={isActive(getProcessedPath(item.path))}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
