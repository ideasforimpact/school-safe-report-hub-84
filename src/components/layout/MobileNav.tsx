
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Home, PieChart, AlertTriangle, List, CheckSquare, Users, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet';

const MobileNav = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const menuItems = [
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
      allowed: true,
    },
    {
      icon: List,
      label: 'All Incidents',
      path: '/incidents',
      allowed: true,
    },
    {
      icon: CheckSquare,
      label: 'My Action Items',
      path: '/my-actions',
      allowed: true,
    },
    {
      icon: PieChart,
      label: 'Insights',
      path: '/insights',
      allowed: isAdmin,
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/users',
      allowed: isAdmin,
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const navigateTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary-600">School CQI</h2>
            <SheetClose className="rounded-full hover:bg-gray-100 p-2">
              <X size={18} />
            </SheetClose>
          </div>

          <nav className="space-y-2">
            {menuItems
              .filter(item => item.allowed)
              .map((item) => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
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
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
