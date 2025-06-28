
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
  const { user, employeeData, isBackofficeUser, isSaasOwner } = useAuth();
  
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Determine if user is backoffice user from useAuth
  const isActualBackofficeUser = isBackofficeUser || user?.role === 'saas_owner';
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
  // Log sidebar state for debugging
  console.log("SidebarContent - State:", {
    user: !!user,
    isBackofficeUser: isBackofficeUser,
    isActualBackofficeUser: isActualBackofficeUser,
    isBackofficeRoute: isBackofficeRoute,
    employeeData: !!employeeData,
    userRole: user?.role,
    location: location.pathname
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isActualBackofficeUser && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isActualBackofficeUser, user, location.pathname, navigate]);
  
  // Fetch modules dynamically
  useEffect(() => {
    // Priority 1: If we're a backoffice user or on backoffice route, always load backoffice modules
    if (isActualBackofficeUser || isBackofficeRoute) {
      setIsLoading(true);
      
      const loadBackofficeModules = async () => {
        try {
          console.log('Loading backoffice modules from database');
          const modules = await fetchModules(true, user);
          const items = convertModulesToSidebarItems(modules, {}, '/backoffice');
          console.log('✅ SidebarContent: Loaded backoffice modules:', items.length);
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
    
  }, [isActualBackofficeUser, isBackofficeRoute, user, employeeData, isProviderAuthenticated]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const activePath = path;
    return currentPath === activePath || (activePath !== '/' && currentPath.startsWith(activePath));
  };

  // Process paths for backoffice users - add /backoffice prefix if not already present
  const getProcessedPath = (path: string) => {
    // If user is backoffice user and path doesn't already start with /backoffice, add it
    if ((isActualBackofficeUser || isBackofficeRoute)) {
      if (path === '/') {
        return '/backoffice';
      }
      return path.startsWith('/backoffice') ? path : `/backoffice${path}`;
    }
    return path;
  };

  // For provider-authenticated users on client routes, use the dedicated component
  if (isProviderAuthenticated && !isBackofficeRoute && !isActualBackofficeUser) {
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
