
import React, { createContext, useContext } from 'react';
import { useEmployeeValidation } from '@/hooks/useEmployeeValidation';
import { useLocation } from 'react-router-dom';

interface EmployeeValidationContextType {
  isValidating: boolean;
  isValid: boolean | null;
  validateEmployee: () => Promise<void>;
}

const EmployeeValidationContext = createContext<EmployeeValidationContextType | undefined>(undefined);

export const useEmployeeValidationContext = () => {
  const context = useContext(EmployeeValidationContext);
  if (!context) {
    throw new Error('useEmployeeValidationContext must be used within a EmployeeValidationProvider');
  }
  return context;
};

interface EmployeeValidationProviderProps {
  children: React.ReactNode;
}

export const EmployeeValidationProvider: React.FC<EmployeeValidationProviderProps> = ({ children }) => {
  const { isValidating, isValid, validateEmployee } = useEmployeeValidation();
  const location = useLocation();
  
  // Skip validation for public routes
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/home'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
  
  // Only render validation context if the user is not on a public route
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  return (
    <EmployeeValidationContext.Provider value={{ isValidating, isValid, validateEmployee }}>
      {children}
    </EmployeeValidationContext.Provider>
  );
};
