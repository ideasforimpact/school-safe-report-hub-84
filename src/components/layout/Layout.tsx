
import { ReactNode } from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { LayoutDashboard, FileText, BarChart3, AlertTriangle, BarChart } from 'lucide-react';
interface LayoutProps {
  children: ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  const {
    user,
    isSaasOwner
  } = useAuth();
  const {
    clients
  } = useClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  // Navigation items for the horizontal menu
  const navigationItems = [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  }, {
    name: 'Report Incident',
    path: '/report-incident',  // Changed from /report to /report-incident to match actual route
    icon: AlertTriangle
  }, {
    name: 'All Incidents',
    path: '/incidents',
    icon: FileText
  }, {
    name: 'Insights',
    path: '/insights',
    icon: BarChart3
  }, {
    name: 'Benchmarking',
    path: '/benchmarking',
    icon: BarChart
  }];
  
  // Check if path is active, including checking if current path starts with item path for nested routes
  const isActive = (path: string) => {
    if (path === '/report-incident' && location.pathname === '/report-incident') {
      return true;
    }
    return location.pathname === path;
  };
  
  return <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-gray-100 shadow-nav w-full">
        <Header />
        
        {/* Navigation tabs - now full width */}
        <div className="w-full bg-white">
          <div className="container mx-auto px-4 hidden md:block bg-neutral-50">
            <nav className="flex space-x-8 overflow-x-auto">
              {navigationItems.map(item => {
              const Icon = item.icon;
              return <button key={item.path} onClick={() => navigate(item.path)} className={`flex items-center gap-2 py-4 px-3 nav-link ${isActive(item.path) ? 'active' : ''}`}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>;
            })}
            </nav>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex md:hidden mb-4">
          <MobileNav />
        </div>
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;
