
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSaasOwnerItems, getClientItems } from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import { ModulePermissions } from '@/contexts/auth/types';

const SidebarContent = () => {
  const location = useLocation();
  const { user, isSaasOwner, isAdmin } = useAuth();
  
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

  // Determine which menu items to show based on user role and current path
  // Check if we're in backoffice mode based on the URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  const menuItems = (isSaasOwner && isBackofficeRoute) ? 
    getSaasOwnerItems() : getClientItems(effectivePermissions);

  const isActive = (path: string) => {
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

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
