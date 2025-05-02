
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  PieChart,
  AlertTriangle,
  List,
  Users,
  Building,
  BarChart,
  Settings,
  User,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user permissions
  const permissions = user?.modulePermissions || {
    incidentReporting: true,
    allIncidents: true,
    insights: true,
    benchmarking: false
  };

  // SaaS Owner (Backoffice) Menu Items
  const saasOwnerItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/backoffice',
      allowed: true,
    },
    {
      icon: Briefcase,
      label: 'Client Management',
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
  const clientItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
    },
    {
      icon: AlertTriangle,
      label: 'Report Incident',
      path: '/report',
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
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/users',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      icon: Building,
      label: 'Facility Management',
      path: '/facilities',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      icon: Settings,
      label: 'Configuration',
      path: '/configuration',
      allowed: isAdmin && !isSaasOwner,
    },
  ];

  const menuItems = isSaasOwner ? saasOwnerItems : clientItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="bg-gray-50 w-64 min-h-screen py-6 hidden md:block">
      <nav>
        <ul className="space-y-2 px-4">
          {menuItems
            .filter(item => item.allowed)
            .map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                  isActive(item.path)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
