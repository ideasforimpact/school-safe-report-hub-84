
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setConfiguredModules, setLoading, setError, setClientId } from '@/store/employeeActions';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/store/types';

export const useEmployeeData = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state, dispatch } = useEmployeeStore();

  // Fetch configured modules for the employee - now optimized to avoid unnecessary calls
  const fetchConfiguredModules = async (employeeId: string, clientId: string | null) => {
    try {
      dispatch(setLoading(true));
      
      if (!clientId) {
        dispatch(setError("Client ID is missing"));
        return;
      }

      // Set the client ID in Redux store
      dispatch(setClientId(clientId));

      // Check Redux store first - if modules are already loaded, don't fetch again
      if (state.configuredModules && state.configuredModules.length > 0) {
        dispatch(setLoading(false));
        return;
      }

      // Get employee data to prepare for fetchModules call
      const { data: employeeDetails, error: employeeError } = await supabase
        .from('employees')
        .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type, employee_id, status')
        .eq('id', employeeId)
        .single();

      if (employeeError) {
        dispatch(setError(employeeError.message));
        return;
      }

      if (!employeeDetails) {
        dispatch(setError("Employee details not found"));
        return;
      }

      // Prepare employee info for fetchModules
      const employeeInfo = {
        id: employeeDetails.id,
        clientId: employeeDetails.client_id,
        email: employeeDetails.email,
        firstName: employeeDetails.first_name,
        lastName: employeeDetails.last_name,
        employeeType: employeeDetails.employee_type,
        employeeId: employeeDetails.employee_id,
        department: employeeDetails.department || '',
        isSuperAdmin: employeeDetails.is_super_admin || false,
        status: employeeDetails.status !== undefined ? employeeDetails.status : true
      };

      console.log("Calling fetchModules with employee info:", employeeInfo);

      // Call fetch-modules edge function
      const { data, error } = await supabase.functions.invoke('fetch-modules', {
        body: { 
          userInfo: user ? {
            id: user.id,
            email: user.email,
            role: user.role
          } : null,
          employeeInfo,
          fetchLevel: 'client'
        }
      });

      if (error) {
        console.error("Error fetching modules:", error);
        dispatch(setError(error.message));
        return;
      }

      if (!data || !data.modules) {
        console.log("No modules returned from fetch-modules");
        dispatch(setError("No modules found"));
        return;
      }

      // Convert the returned modules to our format
      const configuredModules: Module[] = data.modules.map((module: any) => ({
        id: module.id,
        name: module.name,
        key: module.key || module.name.toLowerCase().replace(/\s+/g, '_'),
        icon: module.icon || 'LayoutDashboard',
        level: module.level,
        enabled: true,
        accessLevel: module.access_level || {},
        url: module.url,
        order: module.order
      }));

      console.log("Configured modules from fetch-modules:", configuredModules);
      dispatch(setConfiguredModules(configuredModules));

    } catch (error) {
      console.error("Error in fetchConfiguredModules:", error);
      dispatch(setError("Failed to fetch configured modules"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Set employee data from auth context and fetch modules when available
  useEffect(() => {
    if (authEmployeeData) {
      // Set employee data in Redux store
      dispatch(setEmployeeData(authEmployeeData));
      
      // Set client ID in Redux store
      if (authEmployeeData.clientId) {
        dispatch(setClientId(authEmployeeData.clientId));
      }
      
      // Fetch modules if we have employeeId and clientId
      if (authEmployeeData.id && authEmployeeData.clientId &&
          (!state.configuredModules || state.configuredModules.length === 0)) {
        fetchConfiguredModules(authEmployeeData.id, authEmployeeData.clientId);
      }
    } else {
      // If we have a user but no employee data, try to fetch employee data from the database
      if (user && user.id) {
        const fetchEmployeeDataFromDB = async () => {
          try {
            // Try to get employee data by user ID
            const { data, error } = await supabase
              .from('employees')
              .select('id, client_id, first_name, last_name, email, is_super_admin, department, employee_type, employee_id, status')
              .eq('user_id', user.id)
              .single();
              
            if (error) {
              return;
            }
            
            if (data) {
              const employeeData = {
                id: data.id,
                clientId: data.client_id,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                isSuperAdmin: data.is_super_admin,
                department: data.department,
                employeeType: data.employee_type
              };
              
              // Set employee data in Redux store
              dispatch(setEmployeeData(employeeData));
              
              // Set client ID in Redux store
              if (data.client_id) {
                dispatch(setClientId(data.client_id));
              }
              
              // Fetch modules
              if (data.id && data.client_id) {
                fetchConfiguredModules(data.id, data.client_id);
              }
            }
          } catch (fetchError) {
            // Silent error handling
          }
        };
        
        fetchEmployeeDataFromDB();
      }
    }
  }, [authEmployeeData, user]);

  return {
    employeeData: state.employeeData,
    configuredModules: state.configuredModules,
    isLoading: state.isLoading,
    error: state.error,
    clientId: state.clientId,
    refetchModules: () => {
      if (state.employeeData?.id && state.employeeData?.clientId) {
        fetchConfiguredModules(state.employeeData.id, state.employeeData.clientId);
      }
    }
  };
};
