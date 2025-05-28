
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
  order?: number;
}

const ClientModulesList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useEmployeeStore(); // Get state from Redux
  const configuredModules = getConfiguredModules(state); // Use selector
  const isLoading = getEmployeeLoadingState(state); // Use selector
  const [sidebarModules, setSidebarModules] = useState<ModuleItem[]>([]);

  console.log(configuredModules,"configuredModules")
  
  // Transform Redux store modules into sidebar menu items
  useEffect(() => {
    if (configuredModules && configuredModules.length > 0) {
      console.log("Using modules from Redux store:", configuredModules);
      
      // Map store modules to sidebar items and sort by order
      const modules = configuredModules
        .map(module => {
          // Get icon component
          const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
          
          // Use exact URL from database, fallback to generated path if URL is empty
          const path = module.url;
          
          return {
            icon: IconComponent,
            label: module.name,
            path,
            allowed: true,
            accessLevel: module.accessLevel || {},
            order: module.order
          };
        })
        .sort((a, b) => {
          // Sort by order field (nulls last)
          if (a.order === null || a.order === undefined) return 1;
          if (b.order === null || b.order === undefined) return -1;
          return a.order - b.order;
        });
      
      setSidebarModules(modules);
    } else {
      // Fallback to dashboard if no modules are in the store
      console.log("No modules in Redux store, using default dashboard");
      setSidebarModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true,
        order: 1
      }]);
    }
  }, [configuredModules]);

  // Determine if a path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Check if the current path matches the menu item path or starts with it (for nested routes)
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex-1 py-6 text-white flex justify-center items-center">
  //       <span className="text-sm">Loading...</span>
  //     </div>
  //   );
  // }

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
            />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ClientModulesList;
