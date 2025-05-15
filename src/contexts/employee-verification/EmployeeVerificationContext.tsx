
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeVerificationContextType } from './types';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const verifyEmployee = async (employeeId: string): Promise<boolean> => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (error) {
        console.error('Error verifying employee:', error.message);
        setVerificationError('Could not verify employee ID. Please try again.');
        toast.error('Employee verification failed');
        return false;
      }
      
      if (!data) {
        setVerificationError('Employee not found with the provided ID.');
        toast.error('Employee not found');
        return false;
      }
      
      toast.success('Employee verified successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      setVerificationError('An unexpected error occurred. Please try again.');
      toast.error('Verification error');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const value: EmployeeVerificationContextType = {
    verifyEmployee,
    isVerifying,
    verificationError
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};
