import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setConfiguredModules } from '@/store/employeeActions';
import { getModuleAccessForUser } from '@/services/employee/employeeModuleService';

interface EmployeeModuleRealtimeProps {
  employeeId?: string;
  clientId?: string;
  isSuperAdmin?: boolean;
}

export const useEmployeeModuleRealtime = ({
  employeeId,
  clientId,
  isSuperAdmin
}: EmployeeModuleRealtimeProps) => {
  const { dispatch } = useEmployeeStore();

  const refreshModuleAccess = useCallback(async () => {
    if (!employeeId || !clientId) return;

    try {
      console.log('Refreshing module access for employee:', employeeId);
      const moduleAccess = await getModuleAccessForUser({ 
        id: employeeId, 
        isSuperAdmin, 
        clientId 
      });
      dispatch(setConfiguredModules(moduleAccess));
      console.log('Module access updated:', moduleAccess);
    } catch (error) {
      console.error('Error refreshing module access:', error);
    }
  }, [employeeId, clientId, isSuperAdmin, dispatch]);

  useEffect(() => {
    if (!employeeId) return;

    // Create a channel subscription to listen for changes on employee_modules table
    const channel = supabase
      .channel('employee-modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employee_modules',
          filter: `employee_id=eq.${employeeId}`
        },
        (payload) => {
          console.log('Employee module real-time update received:', payload);
          
          // Refresh module access when any change occurs
          refreshModuleAccess();
        }
      )
      .subscribe();

    console.log('Subscribed to employee module real-time updates for:', employeeId);

    // Clean up subscription when component unmounts
    return () => {
      console.log('Unsubscribing from employee module real-time updates');
      supabase.removeChannel(channel);
    };
  }, [employeeId, refreshModuleAccess]);

  return {
    refreshModuleAccess
  };
};