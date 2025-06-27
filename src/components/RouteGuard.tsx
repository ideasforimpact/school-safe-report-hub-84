
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';

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
  const { authError } = useAuth();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Get authentication and employee state from Redux
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('🛡️ RouteGuard: Route check', {
      path: location.pathname,
      requireAuth,
      requireAdmin,
      requireSaasOwner,
      isBackoffice,
      currentUser: currentUser?.email,
      isBackofficeUser,
      isAdmin,
      isSuperAdmin,
      userRole: currentUser?.role,
      isLoggingOut: state.isLoggingOut
    });
  }, [location.pathname, currentUser, isBackofficeUser, isAdmin, isSuperAdmin, state.isLoggingOut]);

  // If currently logging out, show loading state instead of redirecting
  if (state.isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Logging out...</p>
        </div>
      </div>
    );
  }

  // Special handling for backoffice routes
  if (isBackoffice) {
    // If this is a backoffice route but user is not a backoffice user, redirect
    if (currentUser && !isBackofficeUser && currentUser.role !== 'saas_owner') {
      console.log('🚫 RouteGuard: Non-backoffice user trying to access backoffice, redirecting to dashboard');
      toast.error("You don't have access to the backoffice");
      return <Navigate to="/dashboard" replace />;
    }
    
    // If backoffice route requires auth and no user, redirect to backoffice login
    if (requireAuth && !currentUser) {
      console.log('🔐 RouteGuard: Backoffice route requires auth, redirecting to login');
      return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
    }
  } else {
    // Regular routes - if authentication is required and user is not logged in, redirect to login
    if (requireAuth && !currentUser) {
      console.log('🔐 RouteGuard: Regular route requires auth, redirecting to login');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // If user is backoffice user trying to access regular routes, redirect to backoffice
    if (currentUser && isBackofficeUser && currentUser.role === 'saas_owner') {
      console.log('🏢 RouteGuard: Backoffice user accessing regular route, redirecting to backoffice');
      return <Navigate to="/backoffice" replace />;
    }
  }

  // If admin access is required and user is not admin, redirect appropriately
  if (requireAdmin && currentUser && !isAdmin && !isSuperAdmin) {
    console.log('🚫 RouteGuard: Admin access required but user is not admin');
    toast.error("Admin privileges required to access this page");
    
    if (isBackofficeUser) {
      return <Navigate to="/backoffice" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If owner access is required and user is not super admin or backoffice user, redirect
  if (requireSaasOwner && currentUser && !isSuperAdmin && !isBackofficeUser) {
    console.log('🚫 RouteGuard: SaaS owner access required but user is not owner');
    toast.error("Owner privileges required to access this page");
    
    if (isBackofficeUser) {
      return <Navigate to="/backoffice" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
