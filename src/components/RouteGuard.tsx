
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RouteGuardProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
  requireSaasOwner?: boolean;
}

const RouteGuard = ({ 
  children, 
  requireAdmin = false,
  requireSaasOwner = false 
}: RouteGuardProps) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to access this page");
    } else if (requireAdmin && !isAdmin) {
      toast.error("You need admin privileges to access this page");
    } else if (requireSaasOwner && user.role !== 'saas_owner') {
      toast.error("You need owner privileges to access this page");
    }
  }, [user, isAdmin, requireAdmin, requireSaasOwner]);

  // If user is not logged in, redirect to login page with the return url
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // Check for SaaS owner access
  if (requireSaasOwner && user.role !== 'saas_owner') {
    return <Navigate to="/dashboard" />;
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
