
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface BackofficeLayoutProps {
  children: ReactNode;
}

const BackofficeLayout = ({ children }: BackofficeLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
              <h1 className="text-xl font-bold text-primary">Safe School Backoffice</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>Back to Main Site</span>
              </Link>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs - Desktop */}
      <div className="bg-white border-b border-gray-200 hidden md:block">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={cn(
                  "py-4 px-1 border-b-2 text-sm font-medium",
                  isActive(item.path) 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => navigate(item.path)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium w-full text-left",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                {item.name}
              </button>
            ))}
            
            <Link 
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Back to Main Site
            </Link>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
};

export default BackofficeLayout;
