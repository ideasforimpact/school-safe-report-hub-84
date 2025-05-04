
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { SidebarProvider } from '@/components/ui/sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isSaasOwner } = useAuth();
  const { clients } = useClient();
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-gray-50 flex flex-col w-full">
        <Header />
        <div className="flex flex-1">
          {/* Only show the sidebar for non-SaaS owners */}
          <Sidebar />
          <main className="flex-1 px-4 py-6 md:px-6">
            <div className="flex md:hidden mb-4">
              <MobileNav />
            </div>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
