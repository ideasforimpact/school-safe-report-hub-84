
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useEmployeeValidation = () => {
  const { user, employeeData, logout } = useAuth();
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  
  const validateEmployee = useCallback(async () => {
    // Skip validation if missing data
    if (!employeeData?.id || !employeeData?.clientId || !user) {
      return;
    }
    
    try {
      setIsValidating(true);
      
      const { data, error } = await supabase.functions.invoke('validate-employee', {
        body: {
          clientId: employeeData.clientId,
          employeeId: employeeData.id
        }
      });
      
      if (error) {
        console.error("Employee validation error:", error);
        setIsValid(false);
        toast.error("Failed to validate your access");
        logout();
        navigate('/login');
        return;
      }
      
      if (!data.valid) {
        console.error("Employee validation failed:", data.error);
        setIsValid(false);
        toast.error(data.error || "Your account is not authorized to access the system");
        logout();
        navigate('/login');
        return;
      }
      
      // Employee is valid
      setIsValid(true);
    } catch (err) {
      console.error("Error during employee validation:", err);
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  }, [employeeData?.id, employeeData?.clientId, user, logout, navigate]);
  
  // Run validation on mount and when dependencies change
  useEffect(() => {
    validateEmployee();
  }, [validateEmployee]);
  
  // Setup a validation interval (e.g., every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      validateEmployee();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [validateEmployee]);
  
  // Setup validation on visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateEmployee();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validateEmployee]);
  
  return { 
    isValidating, 
    isValid, 
    validateEmployee 
  };
};
