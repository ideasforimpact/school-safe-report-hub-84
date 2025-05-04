
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, logout, isAdmin, isSaasOwner } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  // Determine the dashboard path based on user role
  const dashboardPath = isSaasOwner ? "/backoffice" : "/dashboard";

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

              {user && <UserRoleBadge isSaasOwner={isSaasOwner} isAdmin={isAdmin} />}

              {/* Settings Menu - Only visible for admins */}
              {isAdmin && !isSaasOwner && <AdminSettingsMenu />}

              <UserProfileMenu user={user} logout={logout} />
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
