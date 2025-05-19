
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

const Header = () => {
  const { user, logout, isAdmin, isSaasOwner, employeeData } = useAuth();
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
  
  // Check if user is super admin based on the employee data
  const isSuperAdmin = employeeData?.isSuperAdmin === true;
  
  // Debug super admin status
  console.log("Header Super Admin Status:", {
    isSuperAdmin,
    employeeData: employeeData ? {
      id: employeeData.id,
      isSuperAdmin: employeeData.isSuperAdmin,
      email: employeeData.email
    } : 'NULL - No employee data found'
  });
  
  // Show admin settings menu only for SaaS owner or super admin users
  const showAdminSettings = isSaasOwner || isSuperAdmin;

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-0">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo Section */}
          <HeaderLogo 
            userClient={userClient} 
            isSaasOwner={isSaasOwner} 
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

              {user && <UserRoleBadge isSaasOwner={isSaasOwner} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />}
              
              {/* Settings Menu - Only visible for SaaS owners or super admins */}
              {showAdminSettings && !isBackoffice && <AdminSettingsMenu />}

              <UserProfileMenu />
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

export default Header;
