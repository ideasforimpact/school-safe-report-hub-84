
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

const Header = () => {
  const { user, logout } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get employee data and admin status from Redux store
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = user?.isSuperAdmin || employeeData?.isSuperAdmin;

  // Log user and Redux state for debugging
  console.log("User from Auth Context:", user);
  console.log("Employee Data from Redux Store:", employeeData);
  console.log("Is Admin from Redux:", isAdmin);
  console.log("Is Super Admin from Redux:", isSuperAdmin);
  console.log("Department:", employeeData?.department);
  console.log("Employee Type:", employeeData?.employeeType);
  console.log("User isSuperAdmin property:", user?.isSuperAdmin);
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Find the client associated with the current user - Use employeeData.clientId from Redux if available
  const userClient = employeeData?.clientId 
    ? clients.find(c => c.id === employeeData.clientId) 
    : user?.clientId 
      ? clients.find(c => c.id === user.clientId) 
      : null;

  // Set dashboard path to /dashboard for all users
  const dashboardPath = "/dashboard";
  
  // Show admin settings menu based on Redux state or user.isSuperAdmin
  const showAdminSettings = isSuperAdmin || isAdmin;

  // Determine if the user is a SaaS Owner (backoffice user)
  const isSaasOwner = user?.role === 'saas_owner';

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-4">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo Section - Positioned at the start */}
          <div className="flex-shrink-0">
            <HeaderLogo 
              userClient={userClient} 
              isSaasOwner={isSuperAdmin || isSaasOwner} 
              dashboardPath={dashboardPath} 
            />
          </div>
          
          {/* Search Bar - Only for logged-in users */}
          {user && !isHomePage && (
            <div className="flex-1 max-w-md mx-4">
              <HeaderSearch />
            </div>
          )}
          
          {/* Navigation links for home page */}
          {isHomePage && (
            <div className="hidden md:flex flex-1 justify-center">
              <HeaderNavLinks />
            </div>
          )}
          
          {/* User Menu - Positioned at the end */}
          {user ? (
            <div className="flex items-center gap-3 flex-shrink-0">
              <HeaderIcons />

              {user && (
                <UserRoleBadge 
                  isSaasOwner={isSaasOwner} 
                  isAdmin={isAdmin && !isSuperAdmin && !isSaasOwner} 
                  isSuperAdmin={isSuperAdmin} 
                  department={employeeData?.department} 
                />
              )}
              
              {/* Settings Menu - Show on all routes if admin/superadmin */}
              {showAdminSettings && !isBackoffice && <AdminSettingsMenu />}

              <UserProfileMenu />
            </div>
          ) : (
            <div className="flex-shrink-0">
              <Button 
                onClick={() => navigate('/login')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
