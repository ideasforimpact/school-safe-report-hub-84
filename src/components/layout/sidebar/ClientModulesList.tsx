
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import SidebarMenuItem from './SidebarMenuItem';
import { LucideIcon } from 'lucide-react';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { 
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  FileCheck,
  MessageSquare,
  Car,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { EmploymentStatus } from '@/contexts/auth/types';

// Map string icon names to Lucide components
const iconMap: Record<string, any> = {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  FileCheck,
  MessageSquare,
  Car,
  FileText,
  Users,
  Settings,
};

interface ModuleItem {
  icon: LucideIcon;
  label: string;
  path: string;
  allowed: boolean;
  accessLevel?: any;
}

const ClientModulesList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, employeeData, cachedClientModules } = useAuth();
  const { getEmployeeId, employee } = useEmployeeAccess(); // Get employee info
  const [configuredModules, setConfiguredModules] = useState<ModuleItem[]>([]);
  
  useEffect(() => {
    // First check if we have cached modules from authentication
    if (cachedClientModules && cachedClientModules.length > 0) {
      console.log("Using cached client modules:", cachedClientModules.length);
      
      // Map modules to sidebar items with their access levels
      const modules: ModuleItem[] = [];
      
      // Always include dashboard if it's in the returned modules or by default
      const dashboardModule = cachedClientModules.find((m: any) => m.name.toLowerCase() === 'dashboard');
      modules.push({
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true,
        accessLevel: dashboardModule?.access_level || {}
      });
      
      // Add other modules
      cachedClientModules.forEach((module: any) => {
        // Skip dashboard as it's already added
        if (module.name.toLowerCase() === 'dashboard') {
          return;
        }
        
        // Get icon component
        const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
        
        // Create path from module name
        const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        modules.push({
          icon: IconComponent,
          label: module.name,
          path,
          allowed: true,
          accessLevel: module.access_level || {}
        });
      });
      
      console.log("Configured modules from cache for sidebar:", modules.map(m => ({ label: m.label, path: m.path })));
      setConfiguredModules(modules);
    } else {
      // Fallback to a basic dashboard if no cached modules
      console.log("No cached modules available for ClientModulesList, showing only Dashboard");
      setConfiguredModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true
      }]);
    }
  }, [user, cachedClientModules]);
  
  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  return (
    <div className="flex-1 py-6">
      <nav className="px-2">
        <ul className="space-y-5">
          {configuredModules.map((item) => (
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

export default ClientModulesList;
