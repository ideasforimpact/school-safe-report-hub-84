
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BackofficeLayout from '@/components/layout/BackofficeLayout';

interface BackofficeRouteGuardProps {
  children: React.ReactNode;
}

const BackofficeRouteGuard = ({ children }: BackofficeRouteGuardProps) => {
  const { user, isBackofficeUser } = useAuth();
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Determine if user is authorized for backoffice
  const isBackofficeAuthorized = isBackofficeUser || user?.role === 'saas_owner';

  console.log("BackofficeRouteGuard - State:", {
    isAuthenticated,
    isBackofficeUser,
    isBackofficeAuthorized,
    userRole: user?.role,
    location: location.pathname
  });

  // If not authenticated, redirect to backoffice login
  if (!isAuthenticated) {
    return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
  }

  // If authenticated but not authorized for backoffice, show error and redirect
  if (!isBackofficeAuthorized) {
    toast.error("Backoffice access required to view this page");
    return <Navigate to="/login" replace />;
  }

  // If authorized, render children within backoffice layout
  return (
    <BackofficeLayout>
      {children}
    </BackofficeLayout>
  );
};

export default BackofficeRouteGuard;
