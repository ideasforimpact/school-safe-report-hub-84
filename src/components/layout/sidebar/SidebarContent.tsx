
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

// Define backoffice modules statically to prevent API calls and flickering
const BACKOFFICE_MODULES = [
  {
    icon: 'LayoutDashboard',
    label: 'Dashboard',
    path: '/backoffice/dashboard',
    allowed: true
  },
  {
    icon: 'Building2',
    label: 'Clients',
    path: '/backoffice/clients',
    allowed: true
  },
  {
    icon: 'FileText',
    label: 'EduSafe Resources',
    path: '/backoffice/edusafe-resources',
    allowed: true
  },
  {
    icon: 'Settings',
    label: 'Modules',
    path: '/backoffice/modules',
    allowed: true
  },
  {
    icon: 'Users',
    label: 'Verification',
    path: '/backoffice/employee-verification',
    allowed: true
  },
  {
    icon: 'Settings',
    label: 'Settings',
    path: '/backoffice/settings',
    allowed: true
  }
];

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

  console.log('SidebarContent - State:', {
    user: user,
    isSaasOwner,
    isBackofficeRoute,
    isProviderAuthenticated,
    userRole: user?.role,
    currentPath: location.pathname
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isSaasOwner && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice/dashboard');
    }
  }, [isSaasOwner, user, location.pathname, navigate]);
  
  // Load modules based on user type and route
  useEffect(() => {
    // For backoffice routes, use static modules to prevent flickering
    if (isBackofficeRoute && (isSaasOwner || user?.role === 'saas_owner')) {
      console.log('Loading static backoffice modules');
      setDynamicMenuItems(BACKOFFICE_MODULES);
      setIsLoading(false);
      return;
    }

    // For provider-authenticated users on client routes, use ClientModulesList
    if (isProviderAuthenticated && !isBackofficeRoute) {
      setIsLoading(false);
      return;
    }
    
    // For other cases, load modules dynamically
    setIsLoading(true);
    
    const loadModules = async () => {
      try {
        if (configuredModules.length > 0) {
          // Convert Redux store modules to sidebar format
          const items = configuredModules.map(module => {
            const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
            return {
              icon: module.icon || 'LayoutDashboard',
              label: module.name,
              path,
              allowed: true
            };
          });
          
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
    const activePath = path;
    return currentPath === activePath || (activePath !== '/' && currentPath.startsWith(activePath));
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
                isActive={isActive(item.path)}
                accessLevel={item.accessLevel}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
