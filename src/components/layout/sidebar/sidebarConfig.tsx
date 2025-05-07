
import { 
  Home, 
  FileText, 
  AlertTriangle,
  Users,
  Building,
  BarChart,
  Settings,
  ClipboardList,
  FileCheck // Added icon for Employee Verification
} from 'lucide-react';
import { ModulePermissions } from '@/contexts/AuthContext';

// SaaS Owner (Backoffice) Menu Items
export const getSaasOwnerItems = () => [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/dashboard', // Changed from /backoffice to /dashboard
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
    icon: FileText,
    label: 'Incidents',
    path: '/incidents',
    allowed: permissions.allIncidents,
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
];

