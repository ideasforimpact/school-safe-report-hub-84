
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HeaderLogo from './HeaderLogo';
import HeaderNavLinks from './HeaderNavLinks';
import UserProfileMenu from './UserProfileMenu';
import HeaderIcons from './HeaderIcons';
import UserRoleBadge from './UserRoleBadge';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser } from '@/store/authSelectors';

const Header = () => {
  const { logout } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get all authentication data from Redux store only
  const currentUser = getCurrentUser(state);
  const isAuthenticated = getIsAuthenticated(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  // Debug logging to track Redux state
  console.log('Header Redux State:', {
    currentUser,
    isAuthenticated,
    isBackofficeUser,
    employeeData,
    isAdmin,
    isSuperAdmin
  });

  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Find the client associated with the current user - Use employeeData.clientId from Redux if available
  const userClient = employeeData?.clientId 
    ? clients.find(c => c.id === employeeData.clientId) 
    : currentUser?.clientId 
      ? clients.find(c => c.id === currentUser.clientId) 
      : null;

  // Set dashboard path to /dashboard for all users
  const dashboardPath = "/dashboard";
  
  // Determine if the user is a SaaS Owner (backoffice user) - Use Redux state only
  const isSaasOwner = currentUser?.role === 'saas_owner' || isBackofficeUser;

  // Final authentication check - Use Redux state only with proper null checks
  const finalIsAuthenticated = Boolean(
    isAuthenticated && (currentUser || employeeData)
  );

  console.log('Header Final Auth State:', {
    finalIsAuthenticated,
    isSaasOwner,
    hasCurrentUser: !!currentUser,
    hasEmployeeData: !!employeeData
  });

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-4">
        <div className="w-full h-full flex items-center justify-between">
          {/* Logo Section - Positioned at absolute left */}
          <HeaderLogo 
            userClient={userClient} 
            isSaasOwner={isSuperAdmin || isSaasOwner} 
            dashboardPath={dashboardPath} 
          />
          
          {/* Navigation links for home page */}
          {isHomePage && <HeaderNavLinks />}
          
          {/* User Menu */}
          {finalIsAuthenticated ? (
            <div className="flex items-center gap-3">
              <HeaderIcons />

              {(currentUser || employeeData) && (
                <UserRoleBadge 
                  isSaasOwner={isSaasOwner} 
                  isAdmin={isAdmin && !isSuperAdmin && !isSaasOwner} 
                  isSuperAdmin={isSuperAdmin} 
                  department={employeeData?.department || currentUser?.department} 
                />
              )}

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
