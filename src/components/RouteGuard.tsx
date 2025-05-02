
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check for SaaS owner access
  if (requireSaasOwner && user.role !== 'saas_owner') {
    return <Navigate to="/dashboard" />;
  }

  // Check for admin access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default RouteGuard;
