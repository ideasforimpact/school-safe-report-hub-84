
import { ReactNode } from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

interface BackofficeLayoutProps {
  children: ReactNode;
}

const BackofficeLayout = ({ children }: BackofficeLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Client Management', path: '/backoffice/clients' },
    { name: 'Analytics', path: '/backoffice/analytics' },
    { name: 'Settings', path: '/backoffice/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Safe School Backoffice</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="font-medium text-sm text-primary-700">
                          {user.firstName.substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <span>{formatUserFullName(user)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut size={16} className="mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive(item.path)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                {item.name}
              </button>
            ))}
          </nav>
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
