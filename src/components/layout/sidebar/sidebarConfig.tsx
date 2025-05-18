
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

// Define module type to match roles table schema
export interface Module {
  id: string;
  name: string;
  icon?: string; // Make optional to handle DB responses
  key?: string;
  active?: boolean;
  description?: string;
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

// Function to fetch modules from backend based on role type
export const fetchModules = async (isBackoffice: boolean): Promise<Module[]> => {
  try {
    // Since there's no level column, we need to adapt our approach
    // For now, we'll fetch all roles and use predefined lists to 
    // determine which ones to show for backoffice vs client users
    const { data, error } = await supabase
      .from('roles')
      .select('*');
    
    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Define which roles are for backoffice (SaaS owner) vs client users
    const backofficeRoleKeys = ['superAdmin', 'clientManagement', 'assessmentTemplateAdmin', 'eduSafeResourceAdmin', 'analyticsAdmin'];
    const clientRoleKeys = ['incidentReporting', 'incidentAdmin', 'assessmentUser', 'assessmentsAdmin', 'employeeVerificationAdmin', 'grievancesAdmin', 'transportSafetyAdmin', 'eduSafeResourceAccess'];
    
    // Filter the fetched roles based on whether they're for backoffice or client users
    return data.filter(role => {
      const isBackofficeRole = backofficeRoleKeys.includes(role.key);
      return isBackoffice ? isBackofficeRole : !isBackofficeRole;
    }).map(role => ({
      id: role.id,
      name: role.name,
      icon: role.icon || 'LayoutDashboard',
      key: role.key,
      active: role.active,
      description: role.description
    }));
  } catch (error) {
    console.error("Error in fetchModules:", error);
    return [];
  }
};

// Convert database modules to sidebar items
export const convertModulesToSidebarItems = (modules: Module[], permissions: ModulePermissions, basePath: string = '') => {
  return modules.map(module => {
    // Get the icon component from our mapping, or default to LayoutDashboard
    const IconComponent = module.icon && iconMap[module.icon] ? iconMap[module.icon] : LayoutDashboard;
    
    // Determine path based on name
    const path = `${basePath}/${module.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if user has permission for this module
    const key = module.key as keyof ModulePermissions | undefined;
    const allowed = key ? (permissions[key] || false) : true;
    
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
