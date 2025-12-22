
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { validateBackofficeSession } from '@/utils/sessionValidation';
import { clearAuth } from '@/store/authActions';
import { authCoordinator } from '@/utils/authCoordinator';
import { checkIPWhitelist } from '@/utils/ipWhitelistCheck';

interface RouteGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireSaasOwner?: boolean;
  isBackoffice?: boolean;
}

const RouteGuard = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireSaasOwner = false,
  isBackoffice = false
}: RouteGuardProps) => {
  const { authError, isProcessingAuth, employeeData } = useAuth();
  const location = useLocation();
  const { state, dispatch } = useEmployeeStore();
  const [ipCheckCompleted, setIpCheckCompleted] = useState(false);
  const [ipWhitelisted, setIpWhitelisted] = useState(true);
  const toastShownRef = React.useRef(false);
  
  // Get authentication and employee state from Redux
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);

  const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
  
  const isExceptionRoute = location.pathname.startsWith('/public-grievance-form') ||
                           location.pathname.startsWith('/grievance-thank-you') ||
                           location.pathname.startsWith('/public-form');

  // Check IP whitelist after authentication (only once per route change)
  useEffect(() => {
   
    if (isBackoffice || 
        isOnLoginRoute || 
        isExceptionRoute || 
        ipCheckCompleted || 
        !requireAuth || 
        !currentUser) {
      return;
    }

    // Only check if we have employee data with clientId
    const clientId = employeeData?.clientId || state.clientId;
    const employeeId = employeeData?.id || currentUser?.id || null;
    
    if (!clientId) {
      // No client ID means backoffice user or no client assigned - skip check
      setIpCheckCompleted(true);
      return;
    }

    if (!employeeId) {
      // No employee ID, can't validate - skip check
      setIpCheckCompleted(true);
      return;
    }

    // Perform IP whitelist check
    const performIPCheck = async () => {
      try {
        const result = await checkIPWhitelist(clientId, employeeId);
        
        if (!result.allowed) {
          setIpWhitelisted(false);
          dispatch(clearAuth());
        } else {
          setIpWhitelisted(true);
        }
      } catch (error) {
        console.error('Error performing IP whitelist check:', error);
        // On error, allow access (backend will validate on API calls)
        setIpWhitelisted(true);
      } finally {
        setIpCheckCompleted(true);
      }
    };

    performIPCheck();
  }, [
    currentUser,
    employeeData,
    state.clientId,
    requireAuth,
    isBackoffice,
    isOnLoginRoute,
    isExceptionRoute,
    ipCheckCompleted,
    dispatch
  ]);

  // Reset IP check when route changes
  useEffect(() => {
    setIpCheckCompleted(false);
    setIpWhitelisted(true);
    toastShownRef.current = false;
  }, [location.pathname]);

  // Handle backoffice route protection with JWT validation (but not on login routes)
  if (isBackoffice && requireAuth && !isOnLoginRoute) {
    // First check if user exists at all
    if (!currentUser) {
      return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
    }
    
    // Then validate the session for backoffice users
    const isValidSession = validateBackofficeSession();
    
    if (!isValidSession) {
      // Clear any stale auth state and redirect to backoffice login
      dispatch(clearAuth());
      toast.error("Your session has expired. Please login again.");
      return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
    }
  }

  // Only show loading during auth processing, not logout
  if (isProcessingAuth && !state.isLoggingOut && !authCoordinator.isLogoutInProgress()) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Authenticating...</p>
      </div>
    </div>;
  }

  const showIPValidationOverlay = requireAuth && 
                                  currentUser && 
                                  !isBackoffice && 
                                  !isOnLoginRoute && 
                                  !isExceptionRoute && 
                                  !ipCheckCompleted;

  if (requireAuth && currentUser && !isBackoffice && !isOnLoginRoute && !isExceptionRoute && ipCheckCompleted && !ipWhitelisted) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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

  // If super admin access is required strictly, redirect to dashboard
  if (requireSuperAdmin && currentUser && !isSuperAdmin) {
    toast.error("Super admin privileges required to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {children ? <>{children}</> : <Outlet />}
      {showIPValidationOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-700">Validating access...</p>
            <p className="text-xs text-gray-500">Please wait</p>
          </div>
        </div>
      )}
    </>
  );
};

export default RouteGuard;
