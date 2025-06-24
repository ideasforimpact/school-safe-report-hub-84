
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
import { loadAuthState } from '@/store/authPersistence';

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
  const { state } = useEmployeeStore(); // Get state from Redux
  const configuredModules = getConfiguredModules(state); // Use selector
  const isLoading = getEmployeeLoadingState(state); // Use selector
  const [sidebarModules, setSidebarModules] = useState<ModuleItem[]>([]);

  console.log(configuredModules,"configuredModules")

  // Check sessionStorage for persisted modules
  const checkSessionStorageModules = () => {
    const persistedState = loadAuthState();
    if (persistedState && persistedState.configuredModules) {
      console.log("SessionStorage modules check:", persistedState.configuredModules.length);
      return persistedState.configuredModules;
    }
    return null;
  };

  // Transform Redux store modules into sidebar menu items
  useEffect(() => {
    console.log("ClientModulesList effect - configuredModules:", configuredModules?.length || 0);
    
    // First check Redux state
    if (configuredModules && configuredModules.length > 0) {
      console.log("Using modules from Redux state:", configuredModules);
      
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
      return;
    }

    // If no modules in Redux, check sessionStorage
    const sessionStorageModules = checkSessionStorageModules();
    if (sessionStorageModules && sessionStorageModules.length > 0) {
      console.log("Using modules from sessionStorage:", sessionStorageModules);
      
      const modules = sessionStorageModules.map((module: any) => {
        const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
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
      return;
    }

    // If sessionStorage explicitly has empty modules array, show only dashboard
    if (sessionStorageModules && Array.isArray(sessionStorageModules) && sessionStorageModules.length === 0) {
      console.log("SessionStorage has empty modules array, showing dashboard only");
      setSidebarModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true,
        accessLevel: {}
      }]);
      return;
    }

    // Final fallback to dashboard if no modules are available anywhere
    console.log("No modules found anywhere, using default dashboard");
    setSidebarModules([{
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
      accessLevel: {}
    }]);
  }, [configuredModules]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
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
