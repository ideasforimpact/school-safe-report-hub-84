
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "@/components/ui/navigation-menu";

interface BackofficeLayoutProps {
  children: ReactNode;
}

const BackofficeLayout = ({ children }: BackofficeLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { name: 'Dashboard', path: '/backoffice' },
    { name: 'Client Management', path: '/backoffice/clients' },
    { name: 'Analytics', path: '/backoffice/analytics' },
    { name: 'Settings', path: '/backoffice/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Safe School Backoffice</h1>
            </div>
            <Link 
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>Back to Main Site</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto">
          <NavigationMenu className="mx-auto">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <NavigationMenuLink
                    className={`block px-4 py-3 text-sm ${
                      isActive(item.path)
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-900'
                    } transition-colors`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
};

export default BackofficeLayout;
