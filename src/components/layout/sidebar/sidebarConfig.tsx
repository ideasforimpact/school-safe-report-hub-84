
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
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define module type to match database schema
export interface Module {
  id: string;
  name: string;
  level: string;
  icon: string;
  key?: string;
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

// Function to fetch modules from backend based on level
export const fetchModules = async (isBackoffice: boolean): Promise<Module[]> => {
  try {
    const query = supabase
      .from('roles')
      .select('*');
    
    if (isBackoffice) {
      query.eq('level', 'backoffice');
    } else {
      query.neq('level', 'backoffice');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
    
    return data || [];
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
    
    // Determine path based on level and name
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
