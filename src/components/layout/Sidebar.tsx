
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
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
      label: 'Report Incident',
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
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
    },
  ];

  const menuItems = isSaasOwner ? saasOwnerItems : clientItems;

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <aside 
      className={cn(
        "fixed top-16 left-0 bottom-0 bg-[#1E2F97] transition-all duration-300 flex flex-col z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 py-6">
        <nav className="px-2">
          <ul className="space-y-2">
            {menuItems
              .filter(item => item.allowed)
              .map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full flex items-center px-3 py-3 rounded-md transition-colors",
                        isActive(item.path)
                          ? "bg-blue-700 text-white"
                          : "text-blue-100 hover:bg-blue-800 hover:text-white"
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                      {!collapsed && (
                        <span className="ml-3 transition-opacity duration-300">{item.label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
      
      {/* Toggle collapse button */}
      <div className="py-4 px-2">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-full flex items-center justify-center px-3 py-2 rounded-md text-blue-100 hover:bg-blue-800"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
