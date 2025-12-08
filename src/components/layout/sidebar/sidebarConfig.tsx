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
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define module type to match modules table schema
export interface Module {
  id: string;
  name: string;
  icon: string; 
  level: string;
  order?: number; // Added order field
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
  ShieldCheck,
};

// Function to fetch modules from backend based on role type with caching
let cachedBackofficeModules: Module[] | null = null;
let cachedClientModules: Module[] | null = null;

// Add function to clear cache when needed
export const clearModuleCache = () => {
  cachedBackofficeModules = null;
  cachedClientModules = null;
};

export const fetchModules = async (isBackoffice: boolean, user?: any, employeeData?: any): Promise<Module[]> => {
  try {
    // For backoffice, clear cache to ensure fresh data
    if (isBackoffice) {
      cachedBackofficeModules = null;
    }
    
    // Check cache first (but skip for backoffice as we cleared it)
    if (isBackoffice && cachedBackofficeModules) {
      return cachedBackofficeModules;
    } else if (!isBackoffice && cachedClientModules) {
      return cachedClientModules;
    }
    
    // For backoffice, fetch modules directly from modules table where level = 'backoffice' AND active = true
    if (isBackoffice) {
      console.log('Fetching backoffice modules from database');
      
      const { data: modulesData, error } = await supabase
        .from('modules')
        .select('*')
        .eq('level', 'backoffice')
        .eq('active', true)
        .order('order', { ascending: true, nullsFirst: false }); // Order by the order column
        
      if (error) {
        console.error('Error fetching backoffice modules:', error);
        return [];
      }
      
      if (!modulesData || modulesData.length === 0) {
        console.log('No active backoffice modules found in database');
        return [];
      }
      
      console.log(`Found ${modulesData.length} active backoffice modules:`, modulesData.map(m => m.name));
      
      // Map modules and add keys for permission mapping
      const modules = modulesData.map(module => ({
        ...module,
        key: module.name.toLowerCase().replace(/\s+/g, '_'),
        access_level: {}
      }));
      
      // Cache the results
      cachedBackofficeModules = modules;
      return modules;
    }
    
    // Prepare user info to send for determining module level and logging
    const userInfo = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      isSaasOwner: user.role === 'saas_owner',
      provider: user.provider // Include provider information
    } : null;
    
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

    console.log("Employee data being sent:", employeeInfo);
    
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
    
    // Map module names to keys for easy reference
    modules.forEach(module => {
      // Set key based on module name for mapping
      module.key = module.level || module.name.toLowerCase().replace(/\s+/g, '_');
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
export const convertModulesToSidebarItems = (modules: Module[], permissions: any, basePath: string = '') => {
  const items = [];
  
  // Sort modules by order field (nulls last)
  const sortedModules = [...modules].sort((a, b) => {
    if (a.order === null || a.order === undefined) return 1;
    if (b.order === null || b.order === undefined) return -1;
    return a.order - b.order;
  });
  
  // Process sorted modules
  sortedModules.forEach(module => {
    // Get the icon component from our mapping, or default to LayoutDashboard
    const IconComponent = iconMap[module.icon || 'LayoutDashboard'] || LayoutDashboard;
    
    // Determine path based on name and base path
    const path = `${basePath}/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // All modules are allowed now - we filter at the database/API level
    let allowed = true;
    
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
  {
    icon: Settings,
    label: 'Import\nConfiguration',
    path: '/backoffice/import-configuration',
    allowed: true,
  },
];

// Client Admin and User Menu Items
export const getClientItems = (permissions: any) => [
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
    allowed: true,
  },
  {
    icon: ClipboardCheck,
    label: 'Assessments',
    path: '/assessments',
    allowed: true,
  },
  {
    icon: FileCheck,
    label: 'Employee\nVerification',
    path: '/employee-verification',
    allowed: true,
  },
  {
    icon: MessageSquare,
    label: 'Grievances',
    path: '/grievances',
    allowed: true,
  },
  {
    icon: Car,
    label: 'Transport\nSafety',
    path: '/transport-safety',
    allowed: true,
  },
  {
    icon: FileText,
    label: 'EduSafe\nResources',
    path: '/edusafe-resources',
    allowed: true,
  },
  {
    icon: FileText,
    label: 'Compliance\nDocuments',
    path: '/compliance-documents',
    allowed: true,
  },
  {
    icon: FileText,
    label: 'Forms',
    path: '/forms',
    allowed: true,
  },
  {
    icon: Users,
    label: 'Users',
    path: '/users',
    allowed: true,
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/configuration',
    allowed: true,
  },
];
