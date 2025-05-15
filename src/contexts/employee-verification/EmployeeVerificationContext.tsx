
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EmployeeVerificationContextType } from './types';
import { supabase } from '@/integrations/supabase/client';

// Create context with default values
const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

// Provider component
export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Example function to verify an employee document (simplified)
  const verifyDocument = async (documentId: string, status: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('employee_documents')
        .update({ verification_status: status })
        .eq('id', documentId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying document:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const value: EmployeeVerificationContextType = {
    isLoading,
    verifyDocument,
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

// Custom hook for using the context
export const useEmployeeVerification = (): EmployeeVerificationContextType => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};
