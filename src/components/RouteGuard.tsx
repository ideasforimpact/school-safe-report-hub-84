
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
  requiredAdmin?: boolean;
  requiredRole?: string;
}

/**
 * A component that guards routes based on authentication and roles.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredAuth = true,
  requiredAdmin = false,
  requiredRole = '',
}) => {
  const { user, isAdmin } = useAuth();

  // If authentication is required and user is not logged in
  if (requiredAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If admin privileges are required and user is not admin
  if (requiredAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
