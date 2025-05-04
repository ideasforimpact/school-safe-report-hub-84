
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <Header />
      </div>
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main Content - width will automatically adjust based on sidebar state */}
        <div className="flex-1 pt-16 transition-all duration-300 pl-0 md:pl-28">
          <div className="container mx-auto p-4 md:p-6">
            <div className="mb-4 md:hidden">
              <MobileNav />
            </div>
            <main className="animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
