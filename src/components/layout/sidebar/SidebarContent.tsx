
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchModules,
  convertModulesToSidebarItems
} from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import ClientModulesList from './ClientModulesList';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, employeeData, isSaasOwner } = useAuth();
  
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Determine if user is backoffice user
  const isBackofficeUser = user?.role === 'saas_owner' || isSaasOwner;
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
  // Log sidebar state for debugging
  console.log("SidebarContent - State:", {
    user: user,
    isBackofficeUser: isBackofficeUser,
    isBackofficeRoute: isBackofficeRoute,
    employeeData: employeeData
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isBackofficeUser && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isBackofficeUser, user, location.pathname, navigate]);
  
  // Fetch modules dynamically
  useEffect(() => {
    // Priority 1: If we're a backoffice user or on backoffice route, always load backoffice modules
    if (isBackofficeUser || isBackofficeRoute) {
      setIsLoading(true);
      
      const loadBackofficeModules = async () => {
        try {
          console.log('Loading backoffice modules from database');
          const modules = await fetchModules(true, user);
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
    
    // Priority 3: Fallback to API call for client modules
    setIsLoading(true);
    
    const loadClientModules = async () => {
      try {
        const modules = await fetchModules(false, user, employeeData);
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
    
  }, [isBackofficeUser, isBackofficeRoute, user, employeeData, isProviderAuthenticated]);

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
