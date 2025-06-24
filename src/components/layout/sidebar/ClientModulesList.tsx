
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

interface Module {
  id: string;
  name: string;
  key?: string;
  icon?: string;
  level: string;
  enabled: boolean;
  accessLevel?: Record<string, any>;
  order?: number;
  url?: string;
}

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

  console.log("EmployeeData from useAuth:", employeeData);

  // Fetch configured modules for the employee
  const fetchConfiguredModules = async (employeeId: string, clientId: string, isSuperAdmin: boolean) => {
    try {
      // Prevent duplicate fetching
      if (isFetchingModules) {
        console.log("Already fetching modules, skipping");
        return;
      }

      setIsFetchingModules(true);
      setIsLoading(true);

      console.log("Fetching modules for employee:", employeeId, "client:", clientId, "isSuperAdmin:", isSuperAdmin);

      // Add a minimum loading time to show the spinner
      const minimumLoadingTime = 1500; // 1.5 seconds
      const startTime = Date.now();

      let configuredModules: Module[] = [];
      
      if (isSuperAdmin) {
        // For super admins, fetch all modules enabled for the client
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error('Error fetching client modules:', clientModulesError);
          setIsLoading(false);
          setIsFetchingModules(false);
          return;
        }

        // Convert client modules to the expected format
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
            return null;
          }
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level,
            icon: moduleObj.icon || '',
            level: moduleObj.level,
            enabled: true,
            accessLevel: cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
      } else {
        // First fetch all client modules to understand what's available
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error('Error fetching client modules:', clientModulesError);
          setIsLoading(false);
          setIsFetchingModules(false);
          return;
        }

        // Then fetch employee-specific module permissions
        const { data: employeeModules, error: employeeModulesError } = await supabase
          .from('employee_modules')
          .select(`
            module_id,
            level
          `)
          .eq('employee_id', employeeId);

        if (employeeModulesError) {
          console.error('Error fetching employee modules:', employeeModulesError);
          setIsLoading(false);
          setIsFetchingModules(false);
          return;
        }

        // Create a map of employee module permissions for quick lookup
        const employeeModuleMap = new Map();
        employeeModules?.forEach(em => {
          employeeModuleMap.set(em.module_id, em.level);
        });

        // Combine client modules with employee-specific permissions
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) {
            return null;
          }
          
          // Check if this module is assigned to the employee
          const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id) || 
                          employeeModules?.length === 0;
          
          if (!hasAccess && employeeModules?.length > 0) {
            return null;
          }
          
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level,
            icon: moduleObj.icon || '',
            level: moduleObj.level,
            enabled: true,
            accessLevel: employeeModuleMap.get(moduleObj.id) || cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
      }

      // If no modules found, we should at least provide a dashboard
      if (configuredModules.length === 0) {
        configuredModules = [{
          id: 'dashboard-default',
          name: 'Dashboard',
          key: 'dashboard',
          icon: 'LayoutDashboard',
          level: 'client',
          enabled: true,
          accessLevel: {}
        }];
      }

      // Ensure minimum loading time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
      
      setTimeout(() => {
        console.log("Setting configured modules:", configuredModules);
        
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
        setIsLoading(false);
        setIsFetchingModules(false);
      }, remainingTime);

    } catch (error) {
      console.error('Error in fetchConfiguredModules:', error);
      setIsLoading(false);
      setIsFetchingModules(false);
    }
  };

  // Fetch modules when employeeData is available
  useEffect(() => {
    if (employeeData && employeeData.id && employeeData.clientId && !isFetchingModules) {
      console.log("Employee data available, fetching modules");
      fetchConfiguredModules(employeeData.id, employeeData.clientId, !!employeeData.isSuperAdmin);
    } else if (!employeeData && !isFetchingModules && !isLoading) {
      // Only show default dashboard if we have no employee data and are not fetching
      console.log("No employee data, using default dashboard");
      setSidebarModules([{
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        allowed: true,
        accessLevel: {}
      }]);
    }
  }, [employeeData, isFetchingModules]);

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
