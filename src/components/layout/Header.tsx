
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
  
  // Determine if the user is a SaaS Owner (backoffice user)
  const isSaasOwner = user?.role === 'saas_owner';

  // Check if user is authenticated - use Redux state as primary source
  const isAuthenticated = Boolean(state.currentUser || user);

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
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <HeaderIcons />

              {(state.currentUser || user) && (
                <UserRoleBadge 
                  isSaasOwner={isSaasOwner} 
                  isAdmin={isAdmin && !isSuperAdmin && !isSaasOwner} 
                  isSuperAdmin={isSuperAdmin} 
                  department={employeeData?.department} 
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
