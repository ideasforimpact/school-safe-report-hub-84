
import { 
  Home, 
  AlertTriangle,
  Users,
  Building,
  BarChart,
  Settings,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Bus,
  FileText,
  Upload,
  Database
} from 'lucide-react';
import { ModulePermissions } from '@/contexts/auth/types';

// SaaS Owner (Backoffice) Menu Items
export const getSaasOwnerItems = () => [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/backoffice/dashboard',
    allowed: true,
  },
  {
    icon: Building,
    label: 'Clients',
    path: '/backoffice/clients',
    allowed: true,
  },
  {
    icon: ClipboardList,
    label: 'Assessment\nTemplates',
    path: '/backoffice/assessment-templates',
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
    icon: Home,
    label: 'Dashboard',
    path: '/dashboard',
    allowed: true,
  },
  {
    icon: AlertTriangle,
    label: 'Incidents',
    path: '/incidents',
    allowed: true,  // Always show for admins
  },
  {
    icon: ClipboardList,
    label: 'Assessments',
    path: '/assessments',
    allowed: true,  // Always show for admins
  },
  {
    icon: FileCheck,
    label: 'Employee\nVerification',
    path: '/employee-verification',
    allowed: true,  // Always show for admins
  },
  {
    icon: MessageSquare,
    label: 'Grievances',
    path: '/grievances',
    allowed: true,  // Always show for admins
  },
  {
    icon: Bus,
    label: 'Transport\nSafety',
    path: '/transport-safety',
    allowed: true,  // Always show for admins
  },
  {
    icon: FileText,
    label: 'EduSafe\nResources',
    path: '/edusafe-resources',
    allowed: true,  // Always show for admins
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

// Update your sidebar config to include the employee management link
// Add this to your sidebar items array:
/*
{
  title: 'Employees',
  path: '/employees',
  icon: <Users className="h-5 w-5" />,
  requiredRole: ['admin', 'saas_owner']
}
*/
