
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
  FileText
} from 'lucide-react';
import { ModulePermissions } from '@/contexts/auth/types';

// SaaS Owner (Backoffice) Menu Items
export const getSaasOwnerItems = () => [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/dashboard',
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
    icon: Bus,
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
    allowed: permissions.incidentReporting || permissions.incidentAdmin || permissions.superAdmin,
  },
  {
    icon: ClipboardList,
    label: 'Assessments',
    path: '/assessments',
    allowed: permissions.assessmentUser || permissions.assessmentsAdmin || permissions.superAdmin,
  },
  {
    icon: FileCheck,
    label: 'Employee\nVerification',
    path: '/employee-verification',
    allowed: permissions.employeeVerificationAdmin || permissions.superAdmin,
  },
  {
    icon: MessageSquare,
    label: 'Grievances',
    path: '/grievances',
    allowed: permissions.grievancesAdmin || permissions.superAdmin,
  },
  {
    icon: Bus,
    label: 'Transport\nSafety',
    path: '/transport-safety',
    allowed: permissions.transportSafetyAdmin || permissions.superAdmin,
  },
  {
    icon: FileText,
    label: 'EduSafe\nResources',
    path: '/edusafe-resources',
    allowed: permissions.eduSafeResourceAccess || permissions.superAdmin,
  },
];
