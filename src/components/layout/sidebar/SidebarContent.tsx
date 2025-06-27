
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
  const [hasError, setHasError] = useState(false);
  
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
  
  // Enhanced module loading with better error handling and stability
  useEffect(() => {
    // Don't load modules if we're using ClientModulesList
    if (isProviderAuthenticated && !isBackofficeRoute) {
      return;
    }
    
    // Don't load if no user or currently logging out
    if (!user || employeeState.isLoggingOut) {
      setDynamicMenuItems([]);
      setIsLoading(false);
      return;
    }
    
    console.log('🔄 SidebarContent: Loading modules for user:', user.email, {
      isSaasOwner,
      isBackofficeRoute,
      userRole: user.role,
      configuredModulesCount: configuredModules.length
    });
    
    setIsLoading(true);
    setHasError(false);
    
    const loadModules = async () => {
      try {
        if (isSaasOwner && isBackofficeRoute && user.role === 'saas_owner') {
          // For backoffice, use predefined modules or fetch from database
          console.log('📊 SidebarContent: Loading backoffice modules');
          
          // First try to use configured modules from Redux store
          if (configuredModules.length > 0) {
            console.log('✅ SidebarContent: Using configured modules from Redux:', configuredModules);
            const items = configuredModules.map(module => ({
              icon: module.icon || 'Settings',
              label: module.name,
              path: `/${module.key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`,
              allowed: true,
              accessLevel: module.accessLevel || {}
            }));
            
            // Add backoffice prefix to paths
            const backofficeItems = items.map(item => ({
              ...item,
              path: item.path.startsWith('/backoffice') ? item.path : `/backoffice${item.path}`
            }));
            
            setDynamicMenuItems(backofficeItems);
          } else {
            // Fallback to database fetch
            console.log('📡 SidebarContent: Fetching backoffice modules from database');
            const modules = await fetchModules(true, user);
            const items = convertModulesToSidebarItems(modules, {}, '/backoffice');
            setDynamicMenuItems(items);
          }
        } else if (configuredModules.length > 0) {
          // Convert Redux store modules to sidebar format for regular users
          console.log('👤 SidebarContent: Using configured modules for regular user:', configuredModules);
          const items = configuredModules.map(module => {
            const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
            return {
              icon: module.icon || 'Settings',
              label: module.name,
              path,
              allowed: true,
              accessLevel: module.accessLevel || {}
            };
          });
          
          setDynamicMenuItems(items);
        } else {
          // Fallback to API call for client modules
          console.log('📡 SidebarContent: Fetching client modules from API');
          const modules = await fetchModules(false, user);
          const items = convertModulesToSidebarItems(modules, {});
          setDynamicMenuItems(items);
        }
      } catch (error) {
        console.error('❌ SidebarContent: Error loading modules:', error);
        setHasError(true);
        
        // Provide fallback modules for backoffice users
        if (isSaasOwner && isBackofficeRoute) {
          const fallbackModules = [
            {
              icon: 'LayoutDashboard',
              label: 'Dashboard',
              path: '/backoffice/dashboard',
              allowed: true,
              accessLevel: {}
            },
            {
              icon: 'Building',
              label: 'Clients',
              path: '/backoffice/clients',
              allowed: true,
              accessLevel: {}
            },
            {
              icon: 'Settings',
              label: 'Settings',
              path: '/backoffice/settings',
              allowed: true,
              accessLevel: {}
            }
          ];
          setDynamicMenuItems(fallbackModules);
        } else {
          setDynamicMenuItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModules();
    
  }, [isSaasOwner, isBackofficeRoute, user, isProviderAuthenticated, configuredModules, employeeState.isLoggingOut]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // Process paths for SaaS owners - add /backoffice prefix if not already present
  const getProcessedPath = (path: string) => {
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
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
          <span className="text-sm">Loading modules...</span>
        </div>
      </div>
    );
  }

  if (hasError && dynamicMenuItems.length === 0) {
    return (
      <div className="flex-1 py-6 text-white flex justify-center items-center">
        <div className="text-center space-y-2">
          <span className="text-sm text-red-300">Failed to load modules</span>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-white underline hover:no-underline"
          >
            Refresh page
          </button>
        </div>
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
