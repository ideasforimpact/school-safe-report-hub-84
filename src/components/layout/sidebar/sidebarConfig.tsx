import { AlertTriangle, ChartBar, FileText, Home, Settings, User, Truck, BookOpen, MessageSquare, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModulePermissions } from '@/contexts/auth/types';

// Types for sidebar menu items
export interface SidebarItem {
  icon: React.ElementType | null;
  label: string;
  path: string;
  allowed: boolean;
}

// Fetch modules from Supabase function
export const fetchModules = async (isBackOffice: boolean = false, user: any = null) => {
  try {
    // If client cache is available, use it first for immediate display
    const cachedModules = localStorage.getItem(`modules_${isBackOffice ? 'backoffice' : 'client'}`);
    
    if (cachedModules) {
      const cachedData = JSON.parse(cachedModules);
      const expiryTime = cachedData.timestamp + (5 * 60 * 1000); // 5 minutes cache
      
      if (Date.now() < expiryTime) {
        console.log('Using cached modules');
        return cachedData.modules;
      }
    }

    // If user has modules, prioritize them
    if (user?.modules && user.modules.length > 0) {
      console.log(`Using ${user.modules.length} modules directly from user object`);
      return user.modules;
    }

    // Otherwise fetch from API
    console.log(`Fetching ${isBackOffice ? 'backoffice' : 'client'} modules from API`);
    
    const { data, error } = await supabase.functions.invoke('fetch-modules', {
      body: {
        userInfo: user ? { 
          id: user.id,
          email: user.email,
          role: user.role,
          isSaasOwner: user.role === 'saas_owner'
        } : null,
        fetchLevel: isBackOffice ? 'backoffice' : 'client'
      }
    });
    
    if (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
    
    if (!data || !data.modules) {
      console.error('Invalid modules data received');
      return [];
    }
    
    // Cache the modules with timestamp
    localStorage.setItem(`modules_${isBackOffice ? 'backoffice' : 'client'}`, JSON.stringify({
      modules: data.modules,
      timestamp: Date.now()
    }));
    
    return data.modules;
  } catch (error) {
    console.error('Error in fetchModules:', error);
    return [];
  }
};

// Convert module objects to sidebar items
export const convertModulesToSidebarItems = (
  modules: any[], 
  permissions: ModulePermissions,
  basePath: string = ''
): SidebarItem[] => {
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    console.error('No modules to convert to sidebar items');
    return [];
  }
  
  console.log(`Converting ${modules.length} modules to sidebar items with base path: ${basePath}`);
  
  return modules.map(module => {
    // Get icon based on module name
    const icon = getIconForModule(module.name);
    
    // Determine path based on module name
    const path = getPathForModule(module.name, basePath);
    
    // Check if user has permission for this module
    const allowed = checkModulePermission(module, permissions);

    console.log(`Module ${module.name}, Path: ${path}, Allowed: ${allowed}`);
    
    return {
      icon,
      label: module.name,
      path,
      allowed
    };
  });
};

// Helper to get appropriate icon for a module
const getIconForModule = (moduleName: string): React.ElementType | null => {
  const moduleIcons: Record<string, React.ElementType> = {
    'Dashboard': Home,
    'Incidents': AlertTriangle,
    'Insights': ChartBar,
    'Reports': FileText,
    'Settings': Settings,
    'Users': User,
    'Transport Safety': Truck,
    'EduSafe Resources': BookOpen,
    'Grievances': MessageSquare,
    'Assessments': ClipboardCheck
  };
  
  // Default to null or a fallback icon if the module name is not recognized
  return moduleIcons[moduleName] || null;
};

// Helper to get appropriate path for a module
const getPathForModule = (moduleName: string, basePath: string = ''): string => {
  const modulePaths: Record<string, string> = {
    'Dashboard': '/dashboard',
    'Incidents': '/incidents',
    'Insights': '/insights',
    'Reports': '/reports',
    'Settings': '/configuration',
    'Users': '/users',
    'Transport Safety': '/transport-safety',
    'EduSafe Resources': '/edusafe-resources',
    'Grievances': '/grievances',
    'Assessments': '/assessments'
  };
  
  const path = modulePaths[moduleName] || `/${moduleName.toLowerCase().replace(/\s+/g, '-')}`;
  return `${basePath}${path}`;
};

// Check if the user has permission for a given module
const checkModulePermission = (module: any, permissions: ModulePermissions): boolean => {
  // If module has specific access_level information, use that
  if (module.access_level) {
    // If isEnabled is explicitly set to false, deny access
    if (module.access_level.isEnabled === false) {
      return false;
    }
    
    // Otherwise, allow access if isEnabled is true or not specified
    return true;
  }
  
  // If no access_level is specified, use the permission mapping
  const moduleKey = module.key || getPermissionKeyForModule(module.name);
  if (!moduleKey) {
    // If no permission key is available, default to allow
    return true;
  }
  
  // Check if the moduleKey exists in permissions
  return moduleKey in permissions ? !!permissions[moduleKey as keyof ModulePermissions] : true;
};

// Map module names to permission keys
const getPermissionKeyForModule = (moduleName: string): string | null => {
  const permissionMapping: Record<string, string> = {
    'Incidents': 'incidentReporting',
    'Incident Management': 'incidentAdmin',
    'Assessments': 'assessmentUser',
    'Assessment Management': 'assessmentsAdmin',
    'Employee Verification': 'employeeVerificationAdmin',
    'Grievances': 'grievancesAdmin',
    'Transport Safety': 'transportSafetyAdmin',
    'EduSafe Resources': 'eduSafeResourceAccess'
  };
  
  return permissionMapping[moduleName] || null;
};

// Fixed client menu items (fallback)
export const getClientItems = (permissions: ModulePermissions): SidebarItem[] => {
  return [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true
    },
    {
      icon: AlertTriangle,
      label: 'Incidents',
      path: '/incidents',
      allowed: permissions.incidentReporting
    },
    {
      icon: ChartBar,
      label: 'Insights',
      path: '/insights',
      allowed: permissions.incidentReporting || permissions.incidentAdmin
    },
    {
      icon: ClipboardCheck,
      label: 'Assessments',
      path: '/assessments',
      allowed: permissions.assessmentUser
    },
    {
      icon: BookOpen,
      label: 'EduSafe Resources',
      path: '/edusafe-resources',
      allowed: permissions.eduSafeResourceAccess
    },
    {
      icon: Truck,
      label: 'Transport Safety',
      path: '/transport-safety',
      allowed: permissions.transportSafetyAdmin
    },
    {
      icon: MessageSquare,
      label: 'Grievances',
      path: '/grievances',
      allowed: permissions.grievancesAdmin
    },
    {
      icon: User,
      label: 'Users',
      path: '/users',
      allowed: permissions.superAdmin
    },
    {
      icon: Settings,
      label: 'Configuration',
      path: '/configuration',
      allowed: permissions.superAdmin
    }
  ];
};

// Fixed SaaS owner menu items (fallback)
export const getSaasOwnerItems = (): SidebarItem[] => {
  return [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true
    },
    {
      icon: User,
      label: 'Clients',
      path: '/clients',
      allowed: true
    },
    {
      icon: FileText,
      label: 'Assessment Templates',
      path: '/assessment-templates',
      allowed: true
    },
    {
      icon: BookOpen,
      label: 'EduSafe Resources',
      path: '/edusafe-resources',
      allowed: true
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      allowed: true
    }
  ];
};
