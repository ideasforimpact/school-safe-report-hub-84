
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '@/contexts/auth';
import { useClient } from '@/contexts/ClientContext';
import { useEmployeeValidation } from '@/hooks/useEmployeeValidation';
import { useEmployeeStore } from '@/store/EmployeeContext';

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
  const { state } = useEmployeeStore();
  
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
          <div className="pt-20 transition-all duration-300 overflow-x-hidden w-full">
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
      {state.isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-gray-600">Switching client...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
