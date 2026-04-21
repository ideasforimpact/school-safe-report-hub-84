
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HeaderLogo from './HeaderLogo';
import HeaderNavLinks from './HeaderNavLinks';
import UserProfileMenu from './UserProfileMenu';
import HeaderIcons from './HeaderIcons';
import UserRoleBadge from './UserRoleBadge';
import HeaderClientSwitcher from './HeaderClientSwitcher';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser } from '@/store/authSelectors';

const Header = () => {
  const { logout } = useAuth();
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

  // Only use client context if we're in backoffice and user is authenticated
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');
  const shouldUseClientContext = isBackofficeRoute && isAuthenticated && isBackofficeUser;
  // Debug logging to track Redux state
  console.log('Header Redux State:', {
    currentUser,
    isAuthenticated,
    isBackofficeUser,
    employeeData,
    isAdmin,
    isSuperAdmin,
    shouldUseClientContext
  });

  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Use direct client object from employeeData or currentUser - no need to search by ID
  const userClient = employeeData?.client || currentUser?.client || null;

  // Debug client resolution
  console.log('Client Resolution Debug:', {
    employeeData: employeeData,
    currentUser: currentUser,
    userClient: userClient,
    employeeHasClient: !!employeeData?.client,
    currentUserHasClient: !!currentUser?.client,
    clientLogo: userClient?.logo,
    clientName: userClient?.name
  });

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
    <div className="w-full h-20 bg-white shadow-sm">
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
              <HeaderClientSwitcher
                currentUser={currentUser}
                employeeData={employeeData}
                isBackofficeUser={isBackofficeUser}
              />
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
