
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

const BackofficeRouteGuard = () => {
  const { user, isSaasOwner } = useAuth();
  
  if (!user) {
    toast.error("You need to be logged in to access this area");
    return <Navigate to="/login" replace />;
  }
  
  if (!isSaasOwner) {
    toast.error("Only backoffice administrators can access this area");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default BackofficeRouteGuard;
