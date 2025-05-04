
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, AlertTriangle, BarChart, Users, Building, Settings } from 'lucide-react';

const MobileNav = () => {
  const { isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation items for SaaS owner (backoffice)
  const saasOwnerNavigationItems = [
    {
      name: 'Dashboard',
      path: '/backoffice',
      icon: LayoutDashboard
    },
    {
      name: 'Clients',
      path: '/backoffice/clients',
      icon: Building
    },
    {
      name: 'Analytics',
      path: '/backoffice/analytics',
      icon: BarChart3
    },
    {
      name: 'Settings',
      path: '/backoffice/settings',
      icon: Settings
    }
  ];

  // Navigation items for school admins/users
  const clientNavigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Report',
      path: '/report-incident',
      icon: AlertTriangle
    },
    {
      name: 'All Incidents',
      path: '/incidents',
      icon: FileText
    },
    {
      name: 'Insights',
      path: '/insights',
      icon: BarChart3
    },
    {
      name: 'Benchmark',
      path: '/benchmarking',
      icon: BarChart
    }
  ];
  
  // Select navigation items based on user role
  const navigationItems = isSaasOwner ? saasOwnerNavigationItems : clientNavigationItems;
  
  // Check if path is active
  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="bg-white">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-[#1E2F97]">
        <div className="py-8 px-4">
          <h2 className="text-lg font-semibold mb-6 px-2 text-white">Navigation</h2>
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    // Fix: Cast the Element to HTMLElement which has the click method
                    const closeButton = document.querySelector('[data-radix-sheet-close]') as HTMLElement;
                    if (closeButton) closeButton.click();
                  }}
                  className={`flex flex-col items-center w-[80px] py-3 px-2 rounded-lg text-center space-y-1 ${
                    isActive(item.path)
                      ? "bg-blue-700 text-white"
                      : "text-blue-100 hover:bg-blue-800 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
