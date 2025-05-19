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
  const { user, employeeData } = useAuth();
  const { getEmployeeId, employee } = useEmployeeAccess(); // Get employee info
  const [configuredModules, setConfiguredModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default
  const [receivedEmployeeData, setReceivedEmployeeData] = useState(null);
  
  useEffect(() => {
    const fetchConfiguredModules = async () => {
      if (!user || !user.id) {
        setConfiguredModules([]);
        setIsLoading(false);
        console.log("No user data available for fetching modules");
        return;
      }
      
      try {
        // Set isLoading to false initially, only set it to true if necessary
        // This way we avoid the loading text while waiting for the response
        
        // Get employee data from context or using the hook
        const currentEmployeeData = employeeData || employee;
        console.log("Fetching modules with employee data:", currentEmployeeData);
        
        // Prepare comprehensive request body with all available employee info
        const requestBody: any = { 
          fetchLevel: 'client',
          email: user.email,
          userInfo: {
            id: user.id,
            email: user.email,
            role: user.role,
            isSaasOwner: user.role === 'saas_owner'
          }
        };
        
        // Include complete employee data if available
        if (currentEmployeeData) {
          // Helper function to safely extract name parts
          const getNameParts = (emp: any) => {
            // If the employee has a name property (string)
            if (typeof emp.name === 'string') {
              const nameParts = emp.name.split(' ');
              return {
                firstName: emp.firstName || nameParts[0] || '',
                lastName: emp.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')
              };
            }
            // Otherwise use firstName/lastName directly
            return {
              firstName: emp.firstName || '',
              lastName: emp.lastName || ''
            };
          };
          
          const nameParts = getNameParts(currentEmployeeData);
          
          requestBody.employeeInfo = {
            ...currentEmployeeData,
            id: currentEmployeeData.id,
            clientId: currentEmployeeData.clientId || currentEmployeeData.clientId,
            email: currentEmployeeData.email,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            department: currentEmployeeData.department || null,
            employeeType: currentEmployeeData.employeeType || null,
            isSuperAdmin: 'isSuperAdmin' in currentEmployeeData ? currentEmployeeData.isSuperAdmin : false,
            status: currentEmployeeData.status || true,
            employeeId: currentEmployeeData.employeeId || null
          };
          console.log("Including comprehensive employee info in fetch-modules request:", requestBody.employeeInfo);
        } else if (employeeData?.id) {
          requestBody.employeeId = employeeData.id;
          console.log("Including employee ID in fetch-modules request:", employeeData.id);
        } else {
          console.log("No employee data available - will attempt to find by email only");
        }
        
        // Use requestAnimationFrame to ensure DOM is rendered first before making the API call
        requestAnimationFrame(async () => {
          // Call the fetch-modules function with comprehensive request parameters
          const { data, error } = await supabase.functions.invoke('fetch-modules', {
            body: requestBody
          });
          
          if (error) {
            console.error("Error invoking fetch-modules function:", error);
            setConfiguredModules([{
              icon: LayoutDashboard,
              label: 'Dashboard',
              path: '/dashboard',
              allowed: true
            }]);
            toast.error("Failed to load menu items");
            return;
          }
          
          // Store the employee data returned from the edge function if available
          if (data && data.employee) {
            console.log("Received employee data from fetch-modules function:", data.employee);
            setReceivedEmployeeData(data.employee);
          }
          
          if (!data || !data.modules || data.modules.length === 0) {
            console.log("No modules returned from fetch-modules function");
            setConfiguredModules([{
              icon: LayoutDashboard,
              label: 'Dashboard',
              path: '/dashboard',
              allowed: true
            }]);
            return;
          }
          
          console.log(`Received ${data.modules.length} modules from fetch-modules function:`, 
            data.modules.map((m: any) => m.name));
          
          // Map modules to sidebar items with their access levels
          const modules: ModuleItem[] = [];
          
          // Always include dashboard if it's in the returned modules or by default
          const dashboardModule = data.modules.find((m: any) => m.name.toLowerCase() === 'dashboard');
          modules.push({
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/dashboard',
            allowed: true,
            accessLevel: dashboardModule?.access_level || {}
          });
          
          // Add other modules
          data.modules.forEach((module: any) => {
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
        });
      } catch (error) {
        console.error("Error loading configured modules:", error);
        toast.error("Failed to load menu items");
        setConfiguredModules([{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          allowed: true
        }]);
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is rendered first
    if (user) {
      requestAnimationFrame(() => {
        fetchConfiguredModules();
      });
    }
  }, [user, getEmployeeId, employeeData, employee]);
  
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
