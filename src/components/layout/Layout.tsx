
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

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
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;
  
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="flex">
        {/* Desktop Sidebar - positioned from the very top */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 w-full overflow-x-hidden">
          {/* Header - positioned only in the content area */}
          <div className="fixed top-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm md:left-28">
            <Header />
          </div>
          
          {/* Main Content - with padding top for header */}
          <div className="pt-16 transition-all duration-300">
            <div className="container mx-auto px-4 max-w-full md:px-6">
              <div className="mb-4 md:hidden">
                <MobileNav />
              </div>
              <main className="animate-fade-in overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
