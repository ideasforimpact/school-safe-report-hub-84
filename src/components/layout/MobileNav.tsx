import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileNav = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  
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
      label: 'Dashboard',
      path: '/backoffice',
      allowed: true,
    },
    {
      label: 'Client Management',
      path: '/backoffice/clients',
      allowed: true,
    },
    {
      label: 'Analytics',
      path: '/backoffice/analytics',
      allowed: true,
    },
    {
      label: 'Settings',
      path: '/backoffice/settings',
      allowed: true,
    },
  ];

  // Client Admin and User Menu Items
  const clientItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
    },
    {
      label: 'Report Incident',
      path: '/report',
      allowed: permissions.incidentReporting,
    },
    {
      label: 'All Incidents',
      path: '/incidents',
      allowed: permissions.allIncidents,
    },
    {
      label: 'Insights',
      path: '/insights',
      allowed: permissions.insights,
    },
    {
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
    },
    {
      label: 'User Management',
      path: '/users',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      label: 'Student Management',
      path: '/students',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      label: 'Facility Management',
      path: '/facilities',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      label: 'Configuration',
      path: '/configuration',
      allowed: isAdmin && !isSaasOwner,
    },
  ];

  const menuItems = isSaasOwner ? saasOwnerItems : clientItems;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-md p-2 bg-white shadow">
          <Menu size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col space-y-2 pt-4">
          {menuItems.filter(item => item.allowed).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="text-left px-4 py-3 hover:bg-gray-100 rounded-md"
            >
              {item.label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
