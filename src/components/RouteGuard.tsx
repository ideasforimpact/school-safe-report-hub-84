
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { validateBackofficeSession } from '@/utils/sessionValidation';
import { clearAuth } from '@/store/authActions';

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
  const { state, dispatch } = useEmployeeStore();
  
  // Get authentication and employee state from Redux
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  // Handle backoffice route protection with JWT validation
  if (isBackoffice && requireAuth) {
    const isValidSession = validateBackofficeSession();
    
    if (!isValidSession) {
      // Clear any stale auth state and redirect to backoffice login
      dispatch(clearAuth());
      toast.error("Your session has expired. Please login again.");
      return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
    }
  }

  // If currently logging out, don't redirect - let the logout process complete
  if (state.isLoggingOut) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Logging out...</p>
      </div>
    </div>;
  }

  // If authentication is required and user is not logged in, redirect to login
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required and user is not admin, redirect to dashboard
  if (requireAdmin && currentUser && !isAdmin) {
    toast.error("Admin privileges required to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  // If owner access is required and user is not super admin or backoffice user, redirect to dashboard
  if (requireSaasOwner && currentUser && !isSuperAdmin && !isBackofficeUser) {
    toast.error("Owner privileges required to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
