
import { 
  Home, 
  FileText, 
  PieChart,
  AlertTriangle,
  List,
  Users,
  Building,
  BarChart,
  Settings
} from 'lucide-react';
import { ModulePermissions } from '@/contexts/AuthContext';

// SaaS Owner (Backoffice) Menu Items
export const getSaasOwnerItems = () => [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/backoffice',
    allowed: true,
  },
  {
    icon: Building,
    label: 'Clients',
    path: '/backoffice/clients',
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
    label: 'Report',
    path: '/report-incident',
    allowed: permissions.incidentReporting,
  },
  {
    icon: List,
    label: 'All Incidents',
    path: '/incidents',
    allowed: permissions.allIncidents,
  },
  {
    icon: PieChart,
    label: 'Insights',
    path: '/insights',
    allowed: permissions.insights,
  },
  {
    icon: BarChart,
    label: 'Benchmark',
    path: '/benchmarking',
    allowed: permissions.benchmarking,
  },
];
