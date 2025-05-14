
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sidebarItems, adminSidebarItems } from './sidebarConfig';
import SidebarMenuItem from './SidebarMenuItem';
import { ModulePermissions } from '@/contexts/auth/types';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  allowed: boolean;
}

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

  // Process menu items based on permission
  const processMenuItems = (items: any[]): MenuItem[] => {
    return items.map(item => {
      let allowed = true;
      
      // Check module-specific permissions
      if (item.module === 'incident-management') {
        allowed = effectivePermissions.incidentReporting || effectivePermissions.incidentAdmin;
      }
      else if (item.module === 'assessment') {
        allowed = effectivePermissions.assessmentUser || effectivePermissions.assessmentsAdmin;
      }
      else if (item.module === 'employee-verification') {
        allowed = effectivePermissions.employeeVerificationAdmin;
      }
      else if (item.module === 'grievances') {
        allowed = effectivePermissions.grievancesAdmin;
      }
      else if (item.module === 'transport-safety') {
        allowed = effectivePermissions.transportSafetyAdmin;
      }
      else if (item.module === 'edusafe') {
        allowed = effectivePermissions.eduSafeResourceAccess;
      }
      
      return {
        label: item.title,
        path: item.path,
        icon: item.icon,
        allowed
      };
    });
  };

  // Determine which menu items to show based on user role
  const menuItems = isSaasOwner ? 
    processMenuItems(adminSidebarItems) : 
    processMenuItems(sidebarItems);

  const isActive = (path: string) => {
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
