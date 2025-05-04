
import { ReactNode } from 'react';
import Header from './Header';
import MainNav from './MainNav';
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
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <Header />
      {user && <MainNav />}
      <main className="flex-1 px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
