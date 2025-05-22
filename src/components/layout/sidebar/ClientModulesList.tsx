
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
  const { state } = useEmployeeStore(); // Get state from Redux
  const configuredModules = getConfiguredModules(state); // Use selector
  const isLoading = getEmployeeLoadingState(state); // Use selector
  const [sidebarModules, setSidebarModules] = useState<ModuleItem[]>([]);

  // Transform Redux store modules into sidebar menu items
  useEffect(() => {
    if (configuredModules && configuredModules.length > 0) {
      console.log("Using modules from Redux store:", configuredModules);
      
      // Map store modules to sidebar items
      const modules = configuredModules.map(module => {
        // Get icon component
        const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
        
        // Create path from module name
        const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        return {
          icon: IconComponent,
          label: module.name,
          path,
          allowed: true,
          accessLevel: module.accessLevel || {}
        };
      });
      
      setSidebarModules(modules);
    } else {
      // Fallback to dashboard if no modules are in the store
      console.log("No modules in Redux store, using default dashboard");
      setSidebarModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true
      }]);
    }
  }, [configuredModules]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // Handle module click to log and store access level in sessionStorage
  const handleModuleClick = (module: ModuleItem) => {
    console.log(`Module clicked: ${module.label}`, module);
    
    // Log the access level for this module
    if (module.accessLevel) {
      console.log(`Access level for ${module.label}:`, module.accessLevel);
      
      // Store the current module's access level in sessionStorage
      sessionStorage.setItem('currentModuleAccessLevel', JSON.stringify(module.accessLevel));
      sessionStorage.setItem('currentModuleLabel', module.label);
    }
    
    // Navigate to the module path
    navigate(module.path);
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
              onClick={() => handleModuleClick(item)}
              accessLevel={item.accessLevel}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ClientModulesList;
