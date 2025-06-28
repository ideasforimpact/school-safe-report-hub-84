
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { user, isAdmin, isSaasOwner, employeeData, isBackofficeUser } = useAuth();
  const location = useLocation();
  
  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Determine if user is backoffice user
  const isActualBackofficeUser = isBackofficeUser || user?.role === 'saas_owner';

  // Check if this is a backoffice route by URL path
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');

  console.log("RouteGuard - Authentication State:", {
    user: !!user,
    isAuthenticated: isAuthenticated,
    isBackofficeUser: isBackofficeUser,
    isActualBackofficeUser: isActualBackofficeUser,
    isBackofficeRoute: isBackofficeRoute,
    requireAuth: requireAuth,
    requireSaasOwner: requireSaasOwner,
    location: location.pathname,
    userRole: user?.role
  });

  // Special handling for backoffice routes
  if (isBackofficeRoute || isBackoffice) {
    // If not authenticated, redirect to backoffice login
    if (!isAuthenticated) {
      return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
    }
    
    // If authenticated but not backoffice authorized, deny access
    if (!isActualBackofficeUser) {
      toast.error("Backoffice access required to view this page");
      return <Navigate to="/login" replace />;
    }
  }

  // If authentication is required and user is not authenticated, redirect to appropriate login
  if (requireAuth && !isAuthenticated) {
    const loginPath = isBackoffice || isBackofficeRoute ? '/backoffice/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If admin access is required and user is not admin, redirect to dashboard
  if (requireAdmin && user && !isAdmin && !isActualBackofficeUser) {
    toast.error("Admin privileges required to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  // If owner access is required and user is not owner, redirect to dashboard
  if (requireSaasOwner && user && !isSaasOwner && !isActualBackofficeUser) {
    toast.error("Owner privileges required to access this page");
    const redirectPath = isActualBackofficeUser ? "/backoffice/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
