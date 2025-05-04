
import { ReactNode } from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isSaasOwner } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;
  
  // Navigation items for the horizontal menu
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Report Incident', path: '/report' },
    { name: 'All Incidents', path: '/incidents' },
    { name: 'Insights', path: '/insights' },
    { name: 'Benchmarking', path: '/benchmarking' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 hidden md:block">
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
      
      <div className="container mx-auto py-6 px-6">
        <div className="flex md:hidden mb-4">
          <MobileNav />
        </div>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
