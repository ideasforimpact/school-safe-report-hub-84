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
  icon: string; // We'll always set a default value
  level: string;
  created_at?: string;
  updated_at?: string;
  key?: string; // Added as optional since it might be missing in the database
  active?: boolean;
  description?: string; // Added as optional since it might be missing in the database
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

export const fetchModules = async (isBackoffice: boolean): Promise<Module[]> => {
  try {
    // Check cache first
    if (isBackoffice && cachedBackofficeModules) {
      return cachedBackofficeModules;
    } else if (!isBackoffice && cachedClientModules) {
      return cachedClientModules;
    }
    
    // Call our edge function instead of querying the database directly
    const { data, error } = await supabase.functions.invoke('fetch-modules', {
      body: { level: isBackoffice ? 'backoffice' : 'client' }
    });
    
    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
    
    if (!data || !data.modules || data.modules.length === 0) {
      console.log(`No modules found with level ${isBackoffice ? 'backoffice' : 'client'}`);
      return [];
    }
    
    // Cache the results
    const modules = data.modules;
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
  return modules.map(module => {
    // Get the icon component from our mapping, or default to LayoutDashboard
    const IconComponent = iconMap[module.icon || 'LayoutDashboard'];
    
    // Determine path based on name
    const path = `${basePath}/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // For modules, we don't have a specific permission key, so we'll show all modules
    // In a real app, you might want to map module names to permission keys
    const allowed = true; // All modules are allowed for now
    
    return {
      icon: IconComponent,
      label: module.name,
      path,
      allowed,
    };
  });
};

// These functions are kept for backward compatibility
// SaaS Owner (Backoffice) Menu Items
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
