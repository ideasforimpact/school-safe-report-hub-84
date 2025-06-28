
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HeaderLogo from './HeaderLogo';
import HeaderNavLinks from './HeaderNavLinks';
import UserProfileMenu from './UserProfileMenu';
import HeaderIcons from './HeaderIcons';
import UserRoleBadge from './UserRoleBadge';

const Header = () => {
  const { user, employeeData, isBackofficeUser, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Check if we're in the backoffice
  const isBackoffice = location.pathname.startsWith('/backoffice');
  
  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Determine admin status from user or employee data
  const isAdmin = user?.role === 'admin' || user?.modulePermissions?.superAdmin || !!employeeData;
  const isSuperAdmin = user?.isSuperAdmin || employeeData?.isSuperAdmin || isBackofficeUser;

  // Set dashboard path based on user type
  const dashboardPath = isBackofficeUser || user?.role === 'saas_owner' ? "/backoffice/dashboard" : "/dashboard";
  
  // Find the client for logo display (only for non-backoffice users)
  // Fix the TypeScript error by properly mapping all required client properties
  const userClient = !isBackofficeUser && employeeData?.client ? {
    ...employeeData.client,
    email: employeeData.client.email || '',
    phone: employeeData.client.phone || '',
    contactPerson: employeeData.client.contact_person || '',
    creationDate: employeeData.client.creation_date || new Date().toISOString()
  } : null;

  console.log('🎯 Header: Render state:', {
    user: !!user,
    isAuthenticated,
    isBackofficeUser,
    userEmail: user?.email,
    location: location.pathname
  });

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-4">
        <div className="w-full h-full flex items-center justify-between">
          {/* Logo Section - Positioned at absolute left */}
          <HeaderLogo 
            userClient={userClient} 
            isSaasOwner={isSuperAdmin || isBackofficeUser} 
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
                  isSaasOwner={isBackofficeUser || isSaasOwner} 
                  isAdmin={isAdmin && !isSuperAdmin && !isBackofficeUser} 
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
