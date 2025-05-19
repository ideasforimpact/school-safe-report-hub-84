
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import EmployeeDataProvider from '@/components/employee/EmployeeDataProvider';

interface RouteGuardProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
  requireSaasOwner?: boolean;
}

const RouteGuardInner = ({ 
  children, 
  requireAdmin = false,
  requireSaasOwner = false,
  isAdmin,
  isSuperAdmin 
}: RouteGuardProps & { 
  isAdmin: boolean;
  isSuperAdmin: boolean;
}) => {
  const { user, authError } = useAuth();
  const location = useLocation();

  // Notice: This component is set to be more permissive now.
  // It will still show warnings but won't block access

  useEffect(() => {
    if (!user) {
      // Only show if not already showing an auth error and if we're not on the login page
      if (!authError && location.pathname !== '/login') {
        toast.info("You're browsing as a guest. Some features may be limited.");
      }
    } else if (requireAdmin && !isAdmin) {
      toast.warning("This page normally requires admin privileges");
    } else if (requireSaasOwner && !isSuperAdmin) {
      toast.warning("This page normally requires owner privileges");
    }
  }, [user, isAdmin, isSuperAdmin, requireAdmin, requireSaasOwner, authError, location.pathname]);

  // Always allow access, but show different UI based on user status
  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

const RouteGuard = (props: RouteGuardProps) => {
  return (
    <EmployeeDataProvider>
      {({ isAdmin, isSuperAdmin }) => (
        <RouteGuardInner 
          {...props} 
          isAdmin={isAdmin} 
          isSuperAdmin={isSuperAdmin} 
        />
      )}
    </EmployeeDataProvider>
  );
};

export default RouteGuard;
