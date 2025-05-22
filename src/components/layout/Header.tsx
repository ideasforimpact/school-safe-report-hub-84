
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
import { useEffect } from 'react';

const Header = () => {
  const { user, logout, employeeData: authEmployeeData } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get employee data and admin status from Redux store
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  // Enhanced debug logging to help troubleshoot Redux store issues
  useEffect(() => {
    console.log("Header component - User from Auth Context:", user);
    console.log("Header component - Auth Context employeeData:", authEmployeeData);
    console.log("Header component - Employee Data from Redux Store:", employeeData);
    console.log("Header component - Redux Store Employee State:", state);
    console.log("Header component - Is Admin from Redux:", isAdmin);
    console.log("Header component - Is Super Admin from Redux:", isSuperAdmin);
    console.log("Header component - Current location:", location.pathname);
    
    // Additional debugging to compare auth context with Redux
    if (authEmployeeData && !employeeData) {
      console.warn("SYNC ISSUE DETECTED: employeeData exists in Auth Context but not in Redux store");
    } else if (authEmployeeData && employeeData) {
      if (authEmployeeData.id !== employeeData.id) {
        console.warn("SYNC ISSUE DETECTED: employeeData ID mismatch between Auth Context and Redux");
      }
      console.log("Auth and Redux employee data in sync:", authEmployeeData.id === employeeData.id);
    }
  }, [user, authEmployeeData, employeeData, state, isAdmin, isSuperAdmin, location.pathname]);
  
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
  
  // Show admin settings menu based on Redux state
  const showAdminSettings = isSuperAdmin || isAdmin;

  // Determine if the user is a SaaS Owner (backoffice user)
  const isSaasOwner = user?.role === 'saas_owner';

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-0">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo Section */}
          <HeaderLogo 
            userClient={userClient} 
            isSaasOwner={isSuperAdmin || isSaasOwner} 
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

              {user && (
                <UserRoleBadge 
                  isSaasOwner={isSaasOwner} 
                  isAdmin={isAdmin && !isSuperAdmin && !isSaasOwner} 
                  isSuperAdmin={isSuperAdmin} 
                  department={employeeData?.department || authEmployeeData?.department} 
                />
              )}
              
              {/* Settings Menu - Only visible for admins */}
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
