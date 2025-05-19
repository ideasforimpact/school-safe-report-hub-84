
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const { getEmployeeId, employee } = useEmployeeAccess(); // Get employee info
  const [configuredModules, setConfiguredModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchConfiguredModules = async () => {
      if (!user || !user.id) {
        setConfiguredModules([]);
        setIsLoading(false);
        console.log("No user data available for fetching modules");
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get employee ID using the hook
        const employeeId = getEmployeeId();
        console.log("Fetching modules for employee ID:", employeeId);
        
        if (!employeeId) {
          console.error("No employee ID available for module fetch");
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        // Call the fetch-modules function with employeeId parameter
        const { data, error } = await supabase.functions.invoke('fetch-modules', {
          body: { 
            fetchLevel: 'client',
            employeeId: employeeId,
            email: user.email
          }
        });
        
        if (error) {
          console.error("Error invoking fetch-modules function:", error);
          setConfiguredModules([]);
          setIsLoading(false);
          toast.error("Failed to load menu items");
          return;
        }
        
        if (!data || !data.modules || data.modules.length === 0) {
          console.log("No modules returned from fetch-modules function");
          setConfiguredModules([{
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/dashboard',
            allowed: true
          }]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Received ${data.modules.length} modules from fetch-modules function:`, 
          data.modules.map(m => m.name));
        
        // Map modules to sidebar items with their access levels
        const modules: ModuleItem[] = [];
        
        // Always include dashboard if it's in the returned modules or by default
        const dashboardModule = data.modules.find(m => m.name.toLowerCase() === 'dashboard');
        modules.push({
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true,
          accessLevel: dashboardModule?.access_level || {}
        });
        
        // Add other modules
        data.modules.forEach(module => {
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
        
        console.log("Final configured modules for sidebar:", modules.map(m => ({ label: m.label, path: m.path })));
        setConfiguredModules(modules);
      } catch (error) {
        console.error("Error loading configured modules:", error);
        toast.error("Failed to load menu items");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfiguredModules();
  }, [user, getEmployeeId]);
  
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
