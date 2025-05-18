
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Spinner } from '@/components/ui/spinner';

interface BackofficeGuardProps {
  children: ReactNode;
}

export const BackofficeGuard = ({ children }: BackofficeGuardProps) => {
  const { user, isSaasOwner } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Give auth a moment to initialize
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // If not a backoffice user, redirect to appropriate page
  if (!user || !isSaasOwner) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // User is authorized, render children
  return <>{children}</>;
};
