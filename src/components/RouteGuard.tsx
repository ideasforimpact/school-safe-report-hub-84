
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

interface RouteGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSaasOwner?: boolean;
  isBackoffice?: boolean;
}

const RouteGuard = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false,
  requireSaasOwner = false,
  isBackoffice = false
}: RouteGuardProps) => {
  const { user, authError } = useAuth();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get admin status directly from Redux
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

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

export default RouteGuard;
