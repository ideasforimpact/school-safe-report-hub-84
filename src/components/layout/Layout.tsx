
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '@/contexts/auth';
import { useClient } from '@/contexts/ClientContext';
import { useEmployeeValidation } from '@/hooks/useEmployeeValidation';

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
  
  // Use the employee validation hook
  useEmployeeValidation();
  
  return (
    <div className="min-h-screen bg-[#F4F6F9] overflow-hidden">
      <div className="flex w-full">
        {/* Desktop Sidebar - fixed position with z-index */}
        <div className="hidden md:block fixed top-0 bottom-0 left-0 z-50">
          <Sidebar />
        </div>
        
        {/* Adjustable main content area with left padding on md screens but full width content */}
        <div className="flex-1 w-full overflow-hidden md:pl-28">
          {/* Header - fixed position */}
          <div className="fixed top-0 right-0 left-0 z-40 bg-white border-b border-gray-100 shadow-sm md:left-28">
            <Header />
          </div>
          
          {/* Main Content - with padding top for header and full width content */}
          <div className="pt-16 transition-all duration-300 overflow-x-hidden w-full">
            <div className="w-full">
              <div className="mb-4 md:hidden px-4">
                <MobileNav />
              </div>
              <main className="animate-fade-in">
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
