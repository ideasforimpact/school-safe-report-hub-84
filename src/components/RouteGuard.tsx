
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
  const { user, isAdmin, isSaasOwner, employeeData } = useAuth();
  const location = useLocation();
  
  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Determine if user is backoffice user
  const isBackofficeUser = user?.role === 'saas_owner' || isSaasOwner;

  console.log("RouteGuard - Authentication State:", {
    user: user,
    isAuthenticated: isAuthenticated,
    isBackofficeUser: isBackofficeUser,
    requireAuth: requireAuth,
    requireSaasOwner: requireSaasOwner,
    location: location.pathname
  });

  // If authentication is required and user is not authenticated, redirect to appropriate login
  if (requireAuth && !isAuthenticated) {
    const loginPath = isBackoffice ? '/backoffice/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If admin access is required and user is not admin, redirect to dashboard
  if (requireAdmin && user && !isAdmin && !isBackofficeUser) {
    toast.error("Admin privileges required to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  // If owner access is required and user is not owner, redirect to dashboard
  if (requireSaasOwner && user && !isSaasOwner && !isBackofficeUser) {
    toast.error("Owner privileges required to access this page");
    const redirectPath = isBackofficeUser ? "/backoffice/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
