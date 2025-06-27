
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
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  
  // Get authentication state from Redux
  const currentUser = getCurrentUser(employeeState);
  const isBackofficeUser = getIsBackofficeUser(employeeState);
  
  const configuredModules = getConfiguredModules(employeeState);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
  // Log sidebar state for debugging
  console.log("SidebarContent - State:", {
    currentUser: currentUser,
    isBackofficeUser: isBackofficeUser,
    isBackofficeRoute: isBackofficeRoute,
    configuredModules: configuredModules?.length || 0
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isBackofficeUser && currentUser?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isBackofficeUser, currentUser, location.pathname, navigate]);
  
  // Fetch modules dynamically
  useEffect(() => {
    // Priority 1: If we're a backoffice user or on backoffice route, always load backoffice modules
    if (isBackofficeUser || isBackofficeRoute) {
      setIsLoading(true);
      
      const loadBackofficeModules = async () => {
        try {
          console.log('Loading backoffice modules from database');
          const modules = await fetchModules(true, currentUser || user);
          const items = convertModulesToSidebarItems(modules, {}, '/backoffice');
          setDynamicMenuItems(items);
        } catch (error) {
          console.error('Error loading backoffice modules:', error);
          setDynamicMenuItems([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadBackofficeModules();
      return;
    }
    
    // Priority 2: For provider-authenticated users on client routes, use ClientModulesList
    if (isProviderAuthenticated && !isBackofficeRoute) {
      return;
    }
    
    // Priority 3: Use configured modules from Redux store
    if (configuredModules.length > 0) {
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
      return;
    }
    
    // Priority 4: Fallback to API call for client modules
    setIsLoading(true);
    
    const loadClientModules = async () => {
      try {
        const modules = await fetchModules(false, currentUser || user);
        const items = convertModulesToSidebarItems(modules, {});
        setDynamicMenuItems(items);
      } catch (error) {
        console.error('Error loading client modules:', error);
        setDynamicMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClientModules();
    
  }, [isBackofficeUser, isBackofficeRoute, currentUser, user, isProviderAuthenticated, configuredModules]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const activePath = path;
    return currentPath === activePath || (activePath !== '/' && currentPath.startsWith(activePath));
  };

  // Process paths for backoffice users - add /backoffice prefix if not already present
  const getProcessedPath = (path: string) => {
    // If user is backoffice user and path doesn't already start with /backoffice, add it
    if ((isBackofficeUser || isBackofficeRoute)) {
      if (path === '/') {
        return '/backoffice';
      }
      return path.startsWith('/backoffice') ? path : `/backoffice${path}`;
    }
    return path;
  };

  // For provider-authenticated users on client routes, use the dedicated component
  if (isProviderAuthenticated && !isBackofficeRoute && !isBackofficeUser) {
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
