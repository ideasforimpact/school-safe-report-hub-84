
import { Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LayoutDashboard, AlertTriangle, FileText, BarChart3, BarChart } from 'lucide-react';

const MobileNav = () => {
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
  
  // Client Admin and User Menu Items
  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
      icon: LayoutDashboard,
    },
    {
      label: 'Report Incident',
      path: '/report-incident', // Updated path to match the actual route
      allowed: permissions.incidentReporting,
      icon: AlertTriangle,
    },
    {
      label: 'All Incidents',
      path: '/incidents',
      allowed: permissions.allIncidents,
      icon: FileText,
    },
    {
      label: 'Insights',
      path: '/insights',
      allowed: permissions.insights,
      icon: BarChart3,
    },
    {
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
      icon: BarChart,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-md p-2 bg-white shadow-card">
          <Menu size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-r border-gray-100 pt-8">
        <div className="flex flex-col space-y-1">
          {menuItems.filter(item => item.allowed).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 text-left px-4 py-3 hover:bg-gray-50 rounded-md ${isActive(item.path) ? 'text-primary-600 bg-gray-50' : 'text-gray-700 hover:text-primary-600'}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
