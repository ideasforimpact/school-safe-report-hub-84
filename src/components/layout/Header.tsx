
import React from 'react';
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

const Header = () => {
  const { user, employeeData, isSaasOwner } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Find the client associated with the current user
  const userClient = employeeData?.clientId 
    ? clients.find(c => c.id === employeeData.clientId) 
    : user?.clientId 
      ? clients.find(c => c.id === user.clientId) 
      : null;

  // Set dashboard path to /dashboard for all users
  const dashboardPath = "/dashboard";
  
  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Determine admin status from user or employee data
  const isAdmin = user?.role === 'admin' || user?.modulePermissions?.superAdmin || !!employeeData;
  const isSuperAdmin = user?.isSuperAdmin || employeeData?.isSuperAdmin;

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

              {user && (
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
