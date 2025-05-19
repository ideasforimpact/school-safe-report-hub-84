
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
          .select('id, email')
          .eq('user_id', user.id)
          .single();
          
        if (employeeError || !employeeData) {
          console.error("Error finding employee:", employeeError || "No employee found");
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch employee's configured modules
        const { data: moduleEntries, error: modulesError } = await supabase
          .from('employee_modules')
          .select('module_id, roles(id, key, name)')
          .eq('employee_id', employeeData.id);
          
        if (modulesError) {
          console.error("Error fetching employee modules:", modulesError);
          setConfiguredModules([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Configured modules for employee:", moduleEntries);
        
        // Always include dashboard
        const modules: ModuleItem[] = [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true
        }];
        
        // Map modules to sidebar items
        if (moduleEntries && moduleEntries.length > 0) {
          // Get all module data that matches the employee's configured modules
          const { data: allModules, error: modulesDataError } = await supabase
            .from('modules')
            .select('*')
            .neq('level', 'backoffice');
            
          if (modulesDataError || !allModules) {
            console.error("Error fetching module details:", modulesDataError);
          } else {
            // Build a map of module keys for quick lookup
            const employeeModuleKeys = moduleEntries.map(em => em.roles?.key || '');
            console.log("Employee module keys:", employeeModuleKeys);
            
            // Map modules to paths and icons
            allModules.forEach(module => {
              let moduleKey = '';
              // Set key based on module name for permission mapping
              switch(module.name.toLowerCase()) {
                case 'incidents':
                  moduleKey = 'incidentReporting';
                  break;
                case 'assessments':
                  moduleKey = 'assessmentUser';
                  break;
                case 'employee verification':
                  moduleKey = 'employeeVerificationAdmin';
                  break;
                case 'grievances':
                  moduleKey = 'grievancesAdmin';
                  break;
                case 'transport safety':
                  moduleKey = 'transportSafetyAdmin';
                  break;
                case 'edusafe resources':
                  moduleKey = 'eduSafeResourceAccess';
                  break;
                default:
                  moduleKey = module.name.toLowerCase().replace(/\s+/g, '_');
              }
              
              // Skip if this is the dashboard (already added)
              if (module.name.toLowerCase() === 'dashboard') {
                return;
              }
              
              // Check if this module is in the user's configured modules
              const isAllowed = employeeModuleKeys.includes(moduleKey);
              
              // Get icon component
              const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
              
              // Create path from module name
              const path = `/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
              
              // Add to modules if allowed
              if (isAllowed) {
                modules.push({
                  icon: IconComponent,
                  label: module.name,
                  path,
                  allowed: true
                });
              }
            });
          }
        }
        
        // Always add users and settings for all authenticated users
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
