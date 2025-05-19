
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HeaderLogo from './HeaderLogo';
import HeaderSearch from './HeaderSearch';
import HeaderNavLinks from './HeaderNavLinks';
import UserProfileMenu from './UserProfileMenu';
import HeaderIcons from './HeaderIcons';
import AdminSettingsMenu from './AdminSettingsMenu';
import UserRoleBadge from './UserRoleBadge';
import EmployeeDataProvider from '@/components/employee/EmployeeDataProvider';

// Inner component to receive employee data from Redux
const HeaderInner = ({ employeeData, user, isSuperAdmin, isAdmin, logout }: {
  employeeData: any;
  user: any;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  logout: () => void;
}) => {
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  // Set dashboard path to /dashboard for all users
  const dashboardPath = "/dashboard";
  
  // Show admin settings menu for all admin users
  const showAdminSettings = isSuperAdmin || isAdmin;

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-0">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo Section */}
          <HeaderLogo 
            userClient={userClient} 
            isSaasOwner={isSuperAdmin} 
            dashboardPath={dashboardPath} 
          />
          
          {/* Search Bar - Only for logged-in users */}
          {user && !isHomePage && <HeaderSearch />}
          
          {/* Navigation links for home page */}
          {isHomePage && <HeaderNavLinks />}
          
          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-3">
              <HeaderIcons />

              {user && <UserRoleBadge isSaasOwner={isSuperAdmin} isAdmin={isAdmin} />}
              
              {/* Settings Menu - Only visible for admins */}
              {showAdminSettings && !isBackoffice && <AdminSettingsMenu />}

              <UserProfileMenu employeeData={employeeData} />
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/login')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component that uses EmployeeDataProvider
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <EmployeeDataProvider>
      {({ employeeData, isAdmin, isSuperAdmin }) => (
        <HeaderInner
          employeeData={employeeData}
          user={user}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          logout={logout}
        />
      )}
    </EmployeeDataProvider>
  );
};

export default Header;
