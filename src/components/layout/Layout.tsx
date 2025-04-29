
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
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
