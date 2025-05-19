
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSaasOwnerItems, 
  getClientItems
} from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import ClientModulesList from './ClientModulesList';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getConfiguredModules } from '@/store/employeeSelectors';
import { Module as SidebarModule } from './sidebarConfig';

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
  
  // Use modules from Redux
  useEffect(() => {
    if (isProviderAuthenticated && !isBackofficeRoute) {
      // Use ClientModulesList component for provider-authenticated users
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If in backoffice mode, use static config
      if (isSaasOwner && isBackofficeRoute) {
        const items = getSaasOwnerItems();
        setDynamicMenuItems(items);
      } else if (configuredModules.length > 0) {
        // Convert Redux store modules to sidebar format
        const basePath = '';
        
        const items = configuredModules.map(module => {
          const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
          return {
            icon: null, // Will be resolved in ClientModulesList
            label: module.name,
            path,
            allowed: true
          };
        });
        
        setDynamicMenuItems(items);
      } else {
        // Fallback to static configuration
        const items = getClientItems({});
        setDynamicMenuItems(items);
      }
    } catch (error) {
      console.error('Error preparing sidebar items:', error);
      // Fall back to static configuration
      const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
        getSaasOwnerItems() : getClientItems({});
      setDynamicMenuItems(fallbackItems);
    } finally {
      setIsLoading(false);
    }
    
  }, [isSaasOwner, isBackofficeRoute, user, isProviderAuthenticated, configuredModules]);

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

export default SidebarContent;
