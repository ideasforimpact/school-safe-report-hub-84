
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchConfiguredModules } from '@/services/moduleService';
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
import { Module } from '@/store/types';

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
  const { employeeData } = useAuth();
  
  const [sidebarModules, setSidebarModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingModules, setIsFetchingModules] = useState(false);

  console.log("employeeData from auth:", employeeData);
  console.log("isFetchingModules:", isFetchingModules);
  console.log("isLoading:", isLoading);

  // Fetch modules when employeeData is available
  useEffect(() => {
    const loadModules = async () => {
      if (!employeeData?.id || !employeeData?.clientId || isFetchingModules) {
        console.log("Cannot fetch modules - missing data or already fetching");
        return;
      }

      try {
        setIsFetchingModules(true);
        setIsLoading(true);
        
        console.log("Fetching modules for employee:", employeeData.id, "client:", employeeData.clientId);
        
        const modules = await fetchConfiguredModules(
          employeeData.id, 
          employeeData.clientId,
          !!employeeData.isSuperAdmin
        );
        
        console.log("Fetched modules:", modules);
        
        // Transform modules into sidebar items
        const sidebarItems = modules.map(module => {
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
        
        setSidebarModules(sidebarItems);
        
      } catch (error) {
        console.error("Error fetching modules:", error);
        // Fallback to default dashboard
        setSidebarModules([{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true,
          accessLevel: {}
        }]);
      } finally {
        setIsLoading(false);
        setIsFetchingModules(false);
      }
    };

    loadModules();
  }, [employeeData?.id, employeeData?.clientId, employeeData?.isSuperAdmin]);

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
