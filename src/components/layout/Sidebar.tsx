
import { useState } from 'react';
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
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // We keep the state but won't provide UI to toggle it
  const [collapsed, setCollapsed] = useState(false);
  
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
  const clientItems = [
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

  const menuItems = isSaasOwner ? saasOwnerItems : clientItems;

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  // Changed from top-16 to top-0 to extend to full height
  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 bottom-0 bg-[#1E2F97] transition-all duration-300 flex flex-col z-30",
        collapsed ? "w-24" : "w-28" // slightly increased width for better readability
      )}
    >
      {/* Added padding-top to account for the header height */}
      <div className="flex-1 py-6 pt-16">
        <nav className="px-2">
          <ul className="space-y-5">
            {menuItems
              .filter(item => item.allowed)
              .map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full flex flex-col items-center justify-center py-3 px-2 rounded-md transition-colors text-center",
                        isActive(item.path)
                          ? "bg-blue-700 text-white"
                          : "text-blue-100 hover:bg-blue-800 hover:text-white"
                      )}
                    >
                      <IconComponent className="h-6 w-6 mb-1" />
                      <span className="text-[11px] font-medium whitespace-normal text-center">
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
      {/* Removed the collapse button */}
    </aside>
  );
};

export default Sidebar;
