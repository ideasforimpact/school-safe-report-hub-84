
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const { user } = useAuth();
  const [configuredModules, setConfiguredModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchConfiguredModules = async () => {
      if (!user || !user.id) {
        setConfiguredModules([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Find employee by user ID
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, email, client_id')
          .eq('user_id', user.id)
          .single();
          
        if (employeeError || !employeeData) {
          console.error("Error finding employee:", employeeError || "No employee found");
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Found employee with ID:", employeeData.id, "Email:", employeeData.email, "Client ID:", employeeData.client_id);
        
        if (!employeeData.client_id) {
          console.error("Employee has no client assignment");
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch client's configured modules
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select('module_id, access_level')
          .eq('client_id', employeeData.client_id);
          
        if (clientModulesError) {
          console.error("Error fetching client modules:", clientModulesError);
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Configured modules for client:", clientModules);
        
        // Get module IDs from client modules
        const moduleIds = clientModules.map(cm => cm.module_id);
        
        // If no modules are configured, return empty array
        if (moduleIds.length === 0) {
          console.log("No modules configured for this client");
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch module details
        const { data: modulesData, error: modulesDataError } = await supabase
          .from('modules')
          .select('*')
          .in('id', moduleIds)
          .neq('level', 'backoffice');
          
        if (modulesDataError || !modulesData) {
          console.error("Error fetching module details:", modulesDataError);
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Fetched module details:", modulesData);
        
        // Create a map of module access levels keyed by module ID
        const moduleAccessLevels = {};
        clientModules.forEach(cm => {
          moduleAccessLevels[cm.module_id] = cm.access_level;
        });
        
        // Always include dashboard
        const modules: ModuleItem[] = [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true
        }];
        
        // Map modules to sidebar items with their access levels
        modulesData.forEach(module => {
          // Skip if this is the dashboard (already added)
          if (module.name.toLowerCase() === 'dashboard') {
            return;
          }
          
          // Get icon component
          const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
          
          // Create path from module name
          const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
          
          // Add module with its access level
          modules.push({
            icon: IconComponent,
            label: module.name,
            path,
            allowed: true,
            accessLevel: moduleAccessLevels[module.id] || {}
          });
        });
        
        // Always add users and settings for authenticated users
        modules.push({
          icon: Users,
          label: 'Users',
          path: '/users',
          allowed: true
        });
        
        modules.push({
          icon: Settings,
          label: 'Settings',
          path: '/configuration',
          allowed: true
        });
        
        console.log("Final configured modules for sidebar:", modules.map(m => ({ label: m.label, accessLevel: m.accessLevel })));
        setConfiguredModules(modules);
      } catch (error) {
        console.error("Error loading configured modules:", error);
        toast.error("Failed to load menu items");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfiguredModules();
  }, [user]);
  
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
