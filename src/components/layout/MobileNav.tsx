
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MobileNav = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  
  // If user is a SaaS owner, don't render the mobile nav since they use the horizontal navigation
  if (isSaasOwner) {
    return null;
  }
  
  // Get user permissions
  const permissions = user?.modulePermissions || {
    incidentReporting: true,
    allIncidents: true,
    insights: true,
    benchmarking: false
  };
  
  const menuItems = [
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
      label: 'My Action Items',
      path: '/my-actions',
      allowed: true,
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
      allowed: isAdmin,
    },
    {
      label: 'Facility Management',
      path: '/facilities',
      allowed: isAdmin,
    },
    {
      label: 'Configuration',
      path: '/configuration',
      allowed: isAdmin,
    },
    {
      label: 'Client Management',
      path: '/clients',
      allowed: isAdmin,
    }
  ];

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
      <SheetContent side="left" className="w-64 bg-white" style={{ zIndex: 50 }}>
        <div className="flex flex-col space-y-2 pt-4">
          {menuItems.filter(item => item.allowed).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="text-left px-4 py-3 hover:bg-gray-100 rounded-md text-gray-800"
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
