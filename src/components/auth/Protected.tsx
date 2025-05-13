
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Short timeout to allow auth state to initialize if needed
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default Protected;
