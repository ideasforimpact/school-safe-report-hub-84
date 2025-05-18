
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSaasOwnerItems, getClientItems, fetchModules, convertModulesToSidebarItems } from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import { ModulePermissions } from '@/contexts/auth/types';

const SidebarContent = () => {
  const location = useLocation();
  const { user, isSaasOwner, isAdmin } = useAuth();
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  const effectivePermissions = isAdmin ? 
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

  // Fetch modules from the backend based on user type
  useEffect(() => {
    const loadModules = async () => {
      setIsLoading(true);
      
      // Determine if we're in backoffice mode based on the URL path
      const isBackofficeRoute = location.pathname.startsWith('/backoffice');
      
      try {
        if (isSaasOwner && isBackofficeRoute) {
          // For SaaS owners in backoffice route, fetch backoffice modules
          const backofficeModules = await fetchModules(true);
          const items = convertModulesToSidebarItems(backofficeModules, effectivePermissions, '/backoffice');
          setDynamicMenuItems(items);
        } else {
          // For regular users, fetch non-backoffice modules
          const clientModules = await fetchModules(false);
          const items = convertModulesToSidebarItems(clientModules, effectivePermissions);
          setDynamicMenuItems(items);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
        // Fall back to static configuration if fetching fails
        const fallbackItems = (isSaasOwner && isBackofficeRoute) ? 
          getSaasOwnerItems() : getClientItems(effectivePermissions);
        setDynamicMenuItems(fallbackItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, [location.pathname, isSaasOwner, isAdmin, effectivePermissions]);

  // Determine which menu items to show based on user role and current path
  // Check if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  
  // Use dynamic menu items if available, otherwise fall back to static config
  const menuItems = dynamicMenuItems.length > 0 
    ? dynamicMenuItems 
    : (isSaasOwner && isBackofficeRoute) 
      ? getSaasOwnerItems() 
      : getClientItems(effectivePermissions);

  const isActive = (path: string) => {
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

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
          {menuItems
            .filter(item => item.allowed)
            .map((item) => (
              <SidebarMenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={isActive(item.path)}
              />
            ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarContent;
