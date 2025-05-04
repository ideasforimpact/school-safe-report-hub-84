
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const { clients } = useClient();
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center space-x-3">
            {userClient?.logo ? (
              <img 
                src={userClient.logo} 
                alt={`${userClient.name} logo`}
                className="h-9 w-auto"
              />
            ) : (
              <ShieldCheck className="h-7 w-7 text-primary" />
            )}
            
            <Link to="/dashboard" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary">
                {userClient ? `${userClient.name} Safe School Console` : 'Safe School'}
              </h1>
            </Link>
          </div>
        </div>
      </div>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="flex md:hidden mb-4">
            <MobileNav />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
