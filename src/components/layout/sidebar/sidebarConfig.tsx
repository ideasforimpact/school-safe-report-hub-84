
import React from 'react';
import {
  ClipboardList,
  AlertTriangle,
  BarChart2,
  Settings,
  User,
  FileSpreadsheet,
  School,
  Building,
  LineChart,
  SquareAsterisk,
  Building2,
  UserCheck,
  Bus,
  MessageCircle,
  ThumbsUp,
  BookOpen,
  Home,
  Users
} from 'lucide-react';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  module?: string;
  subitems?: SidebarItem[];
}

export const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Home size={18} />,
  },
  {
    title: 'Incident Management',
    path: '/incidents',
    icon: <AlertTriangle size={18} />,
    module: 'incident-management',
    subitems: [
      {
        title: 'Report Incident',
        path: '/report-incident',
        icon: <ClipboardList size={18} />,
      },
      {
        title: 'View Incidents',
        path: '/incidents',
        icon: <ClipboardList size={18} />,
      },
      {
        title: 'Insights',
        path: '/insights',
        icon: <BarChart2 size={18} />,
      },
      {
        title: 'Benchmarking',
        path: '/benchmarking',
        icon: <LineChart size={18} />,
      },
      {
        title: 'Configuration',
        path: '/incident-configuration',
        icon: <Settings size={18} />,
      }
    ],
  },
  {
    title: 'Employee Verification',
    path: '/employee-verification',
    icon: <UserCheck size={18} />,
    module: 'employee-verification',
    subitems: [
      {
        title: 'Dashboard',
        path: '/employee-verification',
        icon: <Home size={18} />,
      },
      {
        title: 'Employees',
        path: '/employee-verification/employees',
        icon: <Users size={18} />,
      },
      {
        title: 'Upload Document',
        path: '/employee-verification/upload-document',
        icon: <ClipboardList size={18} />,
      },
    ],
  },
  {
    title: 'Transport Safety',
    path: '/transport-safety',
    icon: <Bus size={18} />,
    module: 'transport-safety',
    subitems: [
      {
        title: 'Dashboard',
        path: '/transport-safety',
        icon: <Home size={18} />,
      },
      {
        title: 'Vehicles',
        path: '/transport-safety/vehicles',
        icon: <Bus size={18} />,
      },
      {
        title: 'Documents',
        path: '/transport-safety/documents',
        icon: <ClipboardList size={18} />,
      },
    ],
  },
  {
    title: 'Feedback System',
    path: '/feedback',
    icon: <ThumbsUp size={18} />,
    module: 'feedback',
    subitems: [
      {
        title: 'Dashboard',
        path: '/feedback',
        icon: <Home size={18} />,
      },
      {
        title: 'Forms',
        path: '/feedback/forms',
        icon: <ClipboardList size={18} />,
      },
      {
        title: 'Responses',
        path: '/feedback/responses',
        icon: <MessageCircle size={18} />,
      },
    ],
  },
  {
    title: 'Grievances',
    path: '/grievances',
    icon: <MessageCircle size={18} />,
    module: 'grievances',
    subitems: [
      {
        title: 'Dashboard',
        path: '/grievances',
        icon: <Home size={18} />,
      },
      {
        title: 'View Grievances',
        path: '/grievances/list',
        icon: <MessageCircle size={18} />,
      },
      {
        title: 'Submit Grievance',
        path: '/grievances/submit',
        icon: <ClipboardList size={18} />,
      },
    ],
  },
  {
    title: 'EduSafe Resources',
    path: '/edusafe',
    icon: <BookOpen size={18} />,
    module: 'edusafe',
    subitems: [
      {
        title: 'Browse Resources',
        path: '/edusafe',
        icon: <BookOpen size={18} />,
      },
      {
        title: 'Upload Resource',
        path: '/edusafe/upload',
        icon: <ClipboardList size={18} />,
      },
    ],
  },
  {
    title: 'Assessment',
    path: '/assessments',
    icon: <FileSpreadsheet size={18} />,
    module: 'assessment',
    subitems: [
      {
        title: 'Overview',
        path: '/assessments',
        icon: <Home size={18} />,
      },
      {
        title: 'Templates',
        path: '/assessments/templates',
        icon: <ClipboardList size={18} />,
      },
      {
        title: 'Assignments',
        path: '/assessments/assignments',
        icon: <SquareAsterisk size={18} />,
      },
    ],
  },
  {
    title: 'Configuration',
    path: '/configuration/educational',
    icon: <Settings size={18} />,
    subitems: [
      {
        title: 'Educational Structure',
        path: '/configuration/educational',
        icon: <School size={18} />,
      },
      {
        title: 'Other Settings',
        path: '/configuration/other',
        icon: <Settings size={18} />,
      },
    ],
  },
  {
    title: 'Employees',
    path: '/employees',
    icon: <User size={18} />,
  },
  {
    title: 'Students',
    path: '/students',
    icon: <School size={18} />,
  },
  {
    title: 'Facilities',
    path: '/facilities',
    icon: <Building2 size={18} />,
  },
  {
    title: 'Users',
    path: '/users',
    icon: <Users size={18} />,
  },
  {
    title: 'Clients',
    path: '/clients',
    icon: <Building size={18} />,
  },
];

export const adminSidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    path: '/backoffice',
    icon: <Home size={18} />,
  },
  {
    title: 'Analytics',
    path: '/backoffice/analytics',
    icon: <BarChart2 size={18} />,
  },
  {
    title: 'Assessment Templates',
    path: '/backoffice/assessment-templates',
    icon: <FileSpreadsheet size={18} />,
  },
  {
    title: 'EduSafe Resources',
    path: '/backoffice/edusafe-resources',
    icon: <BookOpen size={18} />,
  },
  {
    title: 'Settings',
    path: '/backoffice/settings',
    icon: <Settings size={18} />,
  },
];
