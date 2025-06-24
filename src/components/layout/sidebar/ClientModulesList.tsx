
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getConfiguredModules, getEmployeeLoadingState } from '@/store/employeeSelectors';
import SidebarMenuItem from './SidebarMenuItem';
import { LucideIcon } from 'lucide-react';
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
  const { state } = useEmployeeStore();
  const configuredModules = getConfiguredModules(state);
  const isLoading = getEmployeeLoadingState(state);
  const isFetchingModules = state.isFetchingModules;
  const [sidebarModules, setSidebarModules] = useState<ModuleItem[]>([]);

  console.log(configuredModules, "configuredModules");
  console.log("isFetchingModules:", isFetchingModules);
  console.log("isLoading:", isLoading);

  // Transform Redux store modules into sidebar menu items
  useEffect(() => {
    // Wait for modules to be fetched before rendering
    if (isFetchingModules) {
      console.log("Still fetching modules, waiting...");
      return;
    }

    if (configuredModules && configuredModules.length > 0) {
      console.log("Using modules from Redux store:", configuredModules);
      
      // Map store modules to sidebar items
      const modules = configuredModules.map(module => {
        // Get icon component
        const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
        
        // Use URL from database or create path from module name as fallback
        const path = module.url || `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        return {
          icon: IconComponent,
          label: module.name,
          path,
          allowed: true,
          accessLevel: module.accessLevel || {}
        };
      });
      
      setSidebarModules(modules);
    } else if (!isFetchingModules && !isLoading) {
      // Only show default dashboard if we're not fetching and have no modules
      console.log("No modules found and not fetching, using default dashboard");
      setSidebarModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true,
        accessLevel: {}
      }]);
    }
  }, [configuredModules, isFetchingModules, isLoading]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // Show loading state while fetching modules
  if (isFetchingModules || isLoading) {
    return (
      <div className="flex-1 py-6 text-white flex justify-center items-center">
        <span className="text-sm">Loading modules...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 py-6">
      <nav className="px-2">
        <ul className="space-y-5">
          {sidebarModules.map((item) => (
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

export default ClientModulesList;
