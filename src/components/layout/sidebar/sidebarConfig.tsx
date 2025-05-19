
import { 
  LayoutDashboard, 
  AlertTriangle,
  Users,
  ClipboardCheck,
  FileText,
  BarChart,
  Settings,
  Building2,
  MessageSquare,
  Car,
  FileCheck
} from 'lucide-react';
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';

// Define module type to match modules table schema
export interface Module {
  id: string;
  name: string;
  icon: string; 
  level: string;
  created_at?: string;
  updated_at?: string;
  key?: string; // Module key for permission mapping
  active?: boolean;
  description?: string;
  access_level?: any; // Added to support access levels from client_modules
}

// Map string icon names to Lucide components
const iconMap: Record<string, any> = {
  LayoutDashboard,
  AlertTriangle,
  Users,
  ClipboardCheck,
  FileText,
  BarChart,
  Settings,
  Building2,
  MessageSquare,
  Car,
  FileCheck,
};

// Define which roles are for backoffice (SaaS owner) vs client users
const backofficeRoleKeys = ['superAdmin', 'clientManagement', 'assessmentTemplateAdmin', 'eduSafeResourceAdmin', 'analyticsAdmin'];
const clientRoleKeys = ['incidentReporting', 'incidentAdmin', 'assessmentUser', 'assessmentsAdmin', 'employeeVerificationAdmin', 'grievancesAdmin', 'transportSafetyAdmin', 'eduSafeResourceAccess'];

// Function to fetch modules from backend based on role type with caching
let cachedBackofficeModules: Module[] | null = null;
let cachedClientModules: Module[] | null = null;

export const fetchModules = async (isBackoffice: boolean, user?: any, employeeData?: any): Promise<Module[]> => {
  try {
    // Check cache first
    if (isBackoffice && cachedBackofficeModules) {
      return cachedBackofficeModules;
    } else if (!isBackoffice && cachedClientModules) {
      return cachedClientModules;
    }
    
    // Prepare user info to send for determining module level and logging
    const userInfo = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      isSaasOwner: user.role === 'saas_owner',
      provider: user.provider // Include provider information
    } : null;

    console.log(user, "user")
    
    // Prepare employee data if available
    const employeeInfo = employeeData ? {
      id: employeeData.id,
      clientId: employeeData.clientId,
      email: employeeData.email,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      employeeType: employeeData.employeeType,
      employeeId: employeeData.id,
      department: employeeData.department || '',
      isSuperAdmin: typeof employeeData.isSuperAdmin === 'boolean' ? employeeData.isSuperAdmin : false,
      status: employeeData.status !== undefined ? employeeData.status : true
    } : null;

    console.log("Employee data being sent:", employeeInfo, employeeData);
    
    // Call our edge function with user and employee info
    const { data, error } = await supabase.functions.invoke('fetch-modules', {
      body: { 
        userInfo,
        employeeInfo,
        fetchLevel: isBackoffice ? 'backoffice' : 'client' 
      }
    });
    
    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
    
    if (!data || !data.modules || data.modules.length === 0) {
      console.log(`No modules found for user ${userInfo?.email || 'anonymous'}`);
      return [];
    }
    
    // Cache the results based on the determined user role
    const modules = data.modules;
    
    // Map module names to permission keys for filtering
    modules.forEach(module => {
      // Set key based on module name for permission mapping
      switch(module.name.toLowerCase()) {
        case 'incidents':
          module.key = 'incidentReporting';
          break;
        case 'assessments':
          module.key = 'assessmentUser';
          break;
        case 'employee verification':
          module.key = 'employeeVerificationAdmin';
          break;
        case 'grievances':
          module.key = 'grievancesAdmin';
          break;
        case 'transport safety':
          module.key = 'transportSafetyAdmin';
          break;
        case 'edusafe resources':
          module.key = 'eduSafeResourceAccess';
          break;
        case 'users':
          module.key = 'users';
          break;
        case 'settings':
        case 'configuration':
          module.key = 'configuration';
          break;
        case 'dashboard':
          module.key = 'dashboard';
          break;
        default:
          // For modules without specific permissions
          module.key = module.name.toLowerCase().replace(/\s+/g, '_');
      }
    });
    
    if (isBackoffice) {
      cachedBackofficeModules = modules;
    } else {
      cachedClientModules = modules;
    }
    
    return modules;
  } catch (error) {
    console.error("Error in fetchModules:", error);
    return [];
  }
};

// Convert database modules to sidebar items
export const convertModulesToSidebarItems = (modules: Module[], permissions: ModulePermissions, basePath: string = '') => {
  const items = [];
  
  // Process modules
  modules.forEach(module => {
    // Get the icon component from our mapping, or default to LayoutDashboard
    const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
    
    // Determine path based on name
    const path = `${basePath}/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Determine if module is allowed based on permissions
    let allowed = true;
    
    // If the module has a key that maps to permissions, check it
    if (module.key && module.key in permissions) {
      allowed = permissions[module.key as keyof ModulePermissions];
    }
    
    items.push({
      icon: IconComponent,
      label: module.name,
      path,
      allowed,
      accessLevel: module.access_level || {},
    });
  });
  
  return items;
};

// These functions are kept for backward compatibility
// SaaS Owner (Backoffice) Menu Items - always include backoffice prefix
export const getSaasOwnerItems = () => [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/backoffice/dashboard',
    allowed: true,
  },
  {
    icon: Building2,
    label: 'Clients',
    path: '/backoffice/clients',
    allowed: true,
  },
  {
    icon: ClipboardCheck,
    label: 'Assessment\nTemplates',
    path: '/backoffice/assessments/templates',
    allowed: true,
  },
  {
    icon: FileText,
    label: 'EduSafe\nResources',
    path: '/backoffice/edusafe-resources',
    allowed: true,
  },
  {
    icon: BarChart,
    label: 'Analytics',
    path: '/backoffice/analytics',
    allowed: true,
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/backoffice/settings',
    allowed: true,
  },
];

// Client Admin and User Menu Items
export const getClientItems = (permissions: ModulePermissions) => [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    allowed: true,
  },
  {
    icon: AlertTriangle,
    label: 'Incidents',
    path: '/incidents',
    allowed: permissions?.incidentReporting || permissions?.incidentAdmin || false,
  },
  {
    icon: ClipboardCheck,
    label: 'Assessments',
    path: '/assessments',
    allowed: permissions?.assessmentUser || permissions?.assessmentsAdmin || false,
  },
  {
    icon: FileCheck,
    label: 'Employee\nVerification',
    path: '/employee-verification',
    allowed: permissions?.employeeVerificationAdmin || false,
  },
  {
    icon: MessageSquare,
    label: 'Grievances',
    path: '/grievances',
    allowed: permissions?.grievancesAdmin || false,
  },
  {
    icon: Car,
    label: 'Transport\nSafety',
    path: '/transport-safety',
    allowed: permissions?.transportSafetyAdmin || false,
  },
  {
    icon: FileText,
    label: 'EduSafe\nResources',
    path: '/edusafe-resources',
    allowed: permissions?.eduSafeResourceAccess || false,
  },
  {
    icon: Users,
    label: 'Users',
    path: '/users',
    allowed: true,  // Always show for admins
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/configuration',
    allowed: true,  // Always show for admins
  },
];
