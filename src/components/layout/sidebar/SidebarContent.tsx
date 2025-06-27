
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
  
  // Fetch modules dynamically - prioritize backoffice users first
  useEffect(() => {
    // Skip if already initialized to prevent re-fetching
    if (hasInitialized) {
      return;
    }
    
    setIsLoading(true);
    
    const loadModules = async () => {
      try {
        // PRIORITY 1: Backoffice users on backoffice routes - ALWAYS use database modules
        if (isSaasOwner && user?.role === 'saas_owner' && isBackofficeRoute) {
          console.log('Loading backoffice modules from database for SaaS owner');
          const modules = await fetchModules(true, user);
          const items = convertModulesToSidebarItems(modules, {}, '/backoffice');
          setDynamicMenuItems(items);
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }
        
        // PRIORITY 2: Provider-authenticated users on client routes - use ClientModulesList
        if (isProviderAuthenticated && !isBackofficeRoute) {
          // ClientModulesList component will handle this case
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }
        
        // PRIORITY 3: Regular client users with configured modules
        if (configuredModules.length > 0 && !isBackofficeRoute) {
          // Convert Redux store modules to sidebar format
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
        }
        // PRIORITY 4: Fallback to API call for client modules
        else if (!isBackofficeRoute) {
          const modules = await fetchModules(false, user);
          const items = convertModulesToSidebarItems(modules, {});
          setDynamicMenuItems(items);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
        setDynamicMenuItems([]);
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    };
    
    loadModules();
    
  }, [isSaasOwner, isBackofficeRoute, user?.role, isProviderAuthenticated, hasInitialized]);

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
                accessLevel={item.accessLevel}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
