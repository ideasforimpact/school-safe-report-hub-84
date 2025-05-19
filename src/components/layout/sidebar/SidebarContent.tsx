
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSaasOwnerItems, 
  getClientItems, 
  convertModulesToSidebarItems 
} from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import ClientModulesList from './ClientModulesList';
import { ModulePermissions } from '@/contexts/auth/types';
import { toast } from 'sonner';

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    isSaasOwner, 
    isAdmin, 
    employeeData, 
    cachedBackofficeModules, 
    cachedClientModules 
  } = useAuth();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  
  // Get user permissions with default fallback
  const defaultPermissions: ModulePermissions = {
    superAdmin: false,
    incidentReporting: true,
    incidentAdmin: false,
    assessmentUser: true,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: true
  };
  
  const permissions: ModulePermissions = user?.modulePermissions || defaultPermissions;

  // For admin users, we want to show all modules regardless of specific permissions
  // If user is authenticated via a provider (like Google), only show their configured modules
  const effectivePermissions = isAdmin && !user?.provider ? 
    {
      ...permissions,
      incidentReporting: true,
      incidentAdmin: true,
      assessmentUser: true,
      assessmentsAdmin: true,
      employeeVerificationAdmin: true,
      grievancesAdmin: true,
      transportSafetyAdmin: true,
      eduSafeResourceAccess: true
    } : permissions;

  // Determine if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Check if user is authenticated via provider (like Google)
  const isProviderAuthenticated = !!user?.provider;
  
  console.log("AUTH DETAILS:", {
    email: user?.email,
    provider: user?.provider || 'none',
    isProviderAuthenticated,
    isBackofficeRoute,
    isSaasOwner
  });
  
  // Auto-redirect SaaS owners to backoffice when they're at root path
  useEffect(() => {
    if (isSaasOwner && user?.role === 'saas_owner' && location.pathname === '/') {
      navigate('/backoffice');
    }
  }, [isSaasOwner, user, location.pathname, navigate]);
  
  // Use cached modules from authentication time
  useEffect(() => {
    if (user) {
      // For SaaS users in backoffice route, use backoffice modules
      // For others, use client modules
      const isBackofficeFetch = isSaasOwner && isBackofficeRoute;
      
      // If this is a provider-authenticated user on client side, use ClientModulesList component
      if (isProviderAuthenticated && !isBackofficeFetch) {
        console.log("Using ClientModulesList for provider-authenticated user:", user?.email);
        return;
      }
      
      // Use cached modules based on the current route
      const modules = isBackofficeFetch ? cachedBackofficeModules : cachedClientModules;
      
      if (modules && modules.length > 0) {
        const basePath = isBackofficeFetch ? '/backoffice' : '';
        
        // If user is authenticated via provider (Google, etc.), filter modules based on permissions
        let items = [];
        
        if (user?.provider) {
          // For provider-authenticated users, only show modules they have permission for
          const filteredModules = modules.filter(module => {
            const moduleKey = module.key;
            // If the module has a key and matches a permission key that is enabled, show it
            return moduleKey && effectivePermissions[moduleKey as keyof ModulePermissions];
          });
          
          items = convertModulesToSidebarItems(filteredModules, effectivePermissions, basePath);
        } else {
          // For regular users, use standard conversion
          items = convertModulesToSidebarItems(modules, effectivePermissions, basePath);
        }
        
        setDynamicMenuItems(items);
        console.log("Using cached modules for sidebar:", items.length);
      } else {
        // Fall back to static configuration if no cached modules
        console.log("No cached modules available, falling back to static config");
        const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
          getSaasOwnerItems() : getClientItems(effectivePermissions);
        setDynamicMenuItems(fallbackItems);
      }
    }
  }, [user, isBackofficeRoute, effectivePermissions, cachedBackofficeModules, cachedClientModules, isSaasOwner, isProviderAuthenticated]);

  // Get appropriate items based on user role and route
  const menuItems = dynamicMenuItems.length > 0 
    ? dynamicMenuItems 
    : (isSaasOwner && isBackofficeRoute) 
      ? getSaasOwnerItems() 
      : getClientItems(effectivePermissions);

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
    console.log("Using ClientModulesList for provider-authenticated user:", user?.email);
    return <ClientModulesList />;
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
