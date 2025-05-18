
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

/**
 * BackofficeGuard component restricts access to backoffice routes
 * to SaaS owner users only.
 */
const BackofficeGuard = () => {
  const { user, isSaasOwner } = useAuth();
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: window.location.pathname } }} />;
  }
  
  // If user is logged in but not a SaaS owner, redirect to dashboard with error message
  if (!isSaasOwner) {
    toast.error("You don't have permission to access the backoffice.");
    return <Navigate to="/dashboard" />;
  }
  
  // If user is a SaaS owner, allow access to the backoffice routes
  return <Outlet />;
};

export default BackofficeGuard;
