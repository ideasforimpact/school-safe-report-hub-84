import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Employee, EmployeeContextType } from './types';
import { 
  getEmployeesFromStorage, 
  saveEmployeesToStorage,
  addEmployee as addEmployeeService,
  updateEmployee as updateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  getEmployeeById as getEmployeeByIdService,
  getEmployeeByUserId as getEmployeeByUserIdService,
  getAllEmployees,
} from '@/services/employee/employeeService';

// Import API services for backend operations
import {
  getAllEmployeesFromApi,
  addEmployeeToApi,
  updateEmployeeInApi,
  deactivateEmployeeInApi,
  deleteEmployeeFromApi,
} from '@/services/employee/employeeApiService';

// Import the toast from sonner for notifications
import { toast } from 'sonner';

// Import module permission service
import { updateModulePermissionsInApi } from '@/services/employee/employeeModulePermissionsService';

// Import the supabase client
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { loadAuthState } from '@/store/authPersistence';

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Only pre-load employees on dedicated employee management routes, not on /settings
  // (UserManagement tab inside Settings fetches its own list when the tab is opened)
  const isEmployeeManagementRoute = location.pathname.startsWith('/employees');

  // Initialize employees from storage only on relevant routes
  useEffect(() => {
    if (isEmployeeManagementRoute) {
      fetchEmployees();
    }
  }, [isEmployeeManagementRoute]);

  // Save employees to localStorage whenever they change
  useEffect(() => {
    if (!loading && isEmployeeManagementRoute) {
      saveEmployeesToStorage(employees);
    }
  }, [employees, loading, isEmployeeManagementRoute]);

  const fetchEmployees = async () => {
    // Only fetch if we're on relevant routes
    if (!isEmployeeManagementRoute) {
      return;
    }

    try {
      setLoading(true);
      // Determine clientId from persisted auth state
      const persisted = loadAuthState();
      const clientId = persisted?.employeeData?.clientId || persisted?.currentUser?.clientId || null;

      if (!clientId) {
        console.warn('EmployeeContext.fetchEmployees: No clientId available, skipping API fetch');
        // Fallback to local storage when clientId is unavailable
        const storedEmployees = getEmployeesFromStorage();
        setEmployees(storedEmployees);
      } else {
        // SECURITY: Always pass clientId to ensure proper filtering
        const apiEmployees = await getAllEmployeesFromApi(clientId, false).catch(() => null);
        if (apiEmployees && apiEmployees.length > 0) {
          setEmployees(apiEmployees);
        } else {
          const storedEmployees = getEmployeesFromStorage();
          setEmployees(storedEmployees);
        }
      }
    } catch (error) {
      console.error("Error initializing employees:", error);
      // Fallback to local storage if API fails
      const storedEmployees = getEmployeesFromStorage();
      setEmployees(storedEmployees);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      
      // Enhanced logging for clientId debugging
      console.log("EmployeeContext: Adding employee with data:", employeeData);
      console.log("clientId value:", employeeData.clientId);
      console.log("typeof clientId:", typeof employeeData.clientId);
      
      // Prepare module access payload if employee has module permissions but no moduleAccessPayload
      if (employeeData.modulePermissions && !employeeData.moduleAccessPayload) {
        const moduleAccessPayload = Object.entries(employeeData.modulePermissions)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => ({
            name: key,
            employeeId: employeeData.employeeId,
            key: key,
            module_id: key // Use key as module_id temporarily; this will be resolved server-side
          }));
          
        employeeData.moduleAccessPayload = moduleAccessPayload;
        console.log("Generated module access payload:", moduleAccessPayload);
      }
      
      // Try to add employee to API first
      try {
        // Make sure clientId is included in the request
        if (!employeeData.clientId) {
          console.warn("Adding employee without clientId! This might cause issues with database foreign key constraints.");
        }
        
        const newEmployee = await addEmployeeToApi(employeeData);
        
        // If the employee has modulePermissions, update them in the database
        if (employeeData.modulePermissions) {
          await updateModulePermissionsInApi(newEmployee.id, employeeData.modulePermissions);
          // Make sure the returned employee has the module permissions
          newEmployee.modulePermissions = employeeData.modulePermissions;
        }
        
        // Log the new employee with its ID and clientId
        console.log("Employee added successfully:", newEmployee);
        console.log("New employee clientId:", newEmployee.clientId);
        
        setEmployees(prev => [...prev, newEmployee]);
        return newEmployee;
      } catch (apiError: any) {
        // Check if this is our known duplicate email error
        if (apiError.code === "DUPLICATE_EMAIL") {
          // The toast is already shown in the service
          throw apiError; // Re-throw to propagate the error to the caller
        }
        
        console.error("API error in addEmployee, falling back to local:", apiError);
        
        // If API fails (for reasons other than duplicate email), fallback to local storage
        const newEmployee = await addEmployeeService(employeeData);
        setEmployees(prev => [...prev, newEmployee]);
        return newEmployee;
      }
    } catch (error) {
      console.error("Error in addEmployee:", error);
      throw error; // Re-throw to propagate to UI
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      setLoading(true);
      
      // Get current employee to ensure client_id is available
      const currentEmployee = employees.find(emp => emp.id === id);
      if (currentEmployee && !updates.clientId) {
        updates.clientId = currentEmployee.clientId;
      }
      
      console.log("EmployeeContext: Updating employee with updates:", updates);
      console.log("clientId in updates:", updates.clientId);
      
      // Try to update employee in API first
      try {
        const updatedEmployee = await updateEmployeeInApi(id, updates);
        
        // If modulePermissions are being updated, update them in the database
        if (updates.modulePermissions) {
          await updateModulePermissionsInApi(id, updates.modulePermissions);
          // Make sure the returned employee has the updated module permissions
          updatedEmployee.modulePermissions = updates.modulePermissions;
        }
        
        setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
        return;
      } catch (apiError) {
        console.error("API error in updateEmployee, falling back to local:", apiError);
        
        // If API fails, fallback to local storage
        const updatedEmployee = await updateEmployeeService(id, updates);
        setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      }
    } catch (error) {
      console.error("Error in updateEmployee:", error);
    } finally {
      setLoading(false);
    }
  };

  const deactivateEmployee = async (id: string): Promise<{ success: boolean, error?: string }> => {
    try {
      setLoading(true);
      
      // Try to deactivate employee in API first
      try {
        console.log("Sending deactivation request for employee:", id);
        
        // Validate that we have a valid ID before proceeding
        if (!id) {
          console.error("Missing employee ID in deactivateEmployee function");
          return { success: false, error: "Employee ID is required" };
        }
        
        // Call the edge function with the correct operation and payload structure
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('VITE_SUPABASE_URL is not set');
        }
        const response = await fetch(`${supabaseUrl}/functions/v1/employee-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({
            operation: 'deactivate',
            id: id  // Make sure the ID is sent in the expected format
          })
        });
        
        // Check if the response is valid
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Non-OK response from deactivate function:", response.status, errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Deactivation response:", result);
        
        if (response.ok && !result.error) {
          // Update the local state to reflect the deactivated employee
          setEmployees(prev => prev.map(emp => emp.id === id ? { 
            ...emp, 
            status: 'inactive',
            // Clear module permissions for deactivated employee
            modulePermissions: {
              superAdmin: false,
              incidentReporting: false,
              incidentAdmin: false,
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: false,
              eduSafeResourceAccess: false
            }
          } : emp));
          
          return { success: true };
        } else {
          throw new Error(result.error || "Failed to deactivate employee");
        }
      } catch (apiError) {
        console.error("API error in deactivateEmployee, falling back to local:", apiError);
        
        // If API fails, fallback to local storage
        await updateEmployeeService(id, { 
          status: 'inactive', 
          modulePermissions: {
            superAdmin: false,
            incidentReporting: false,
            incidentAdmin: false,
            assessmentUser: false,
            assessmentsAdmin: false,
            employeeVerificationAdmin: false,
            grievancesAdmin: false,
            transportSafetyAdmin: false,
            eduSafeResourceAccess: false
          }
        });
        
        setEmployees(prev => prev.map(emp => emp.id === id ? { 
          ...emp, 
          status: 'inactive',
          modulePermissions: {
            superAdmin: false,
            incidentReporting: false,
            incidentAdmin: false,
            assessmentUser: false,
            assessmentsAdmin: false,
            employeeVerificationAdmin: false,
            grievancesAdmin: false,
            transportSafetyAdmin: false,
            eduSafeResourceAccess: false
          }
        } : emp));
        
        return { success: true };
      }
    } catch (error) {
      console.error("Error in deactivateEmployee:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id: string): Promise<{ success: boolean, error?: string }> => {
    try {
      setLoading(true);
      
      // Try to delete employee from API first
      try {
        const result = await deleteEmployeeFromApi(id);
        
        if (result.success) {
          // Only update UI if the operation was successful
          setEmployees(prev => prev.filter(emp => emp.id !== id));
          return { success: true };
        } else if (result.error) {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.error("API error in deleteEmployee:", apiError);
        
        const errorMessage = apiError instanceof Error ? apiError.message : "Unknown error";
        toast.error(`Failed to delete employee: ${errorMessage}`);
        
        // Return the error for the caller to handle
        return { 
          success: false, 
          error: errorMessage
        };
      }
      
      return { success: true }; // Default return if we get here
    } catch (error) {
      console.error("Error in deleteEmployee:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeById = (id: string) => {
    return getEmployeeByIdService(id);
  };

  const getEmployeeByUserId = (userId: string) => {
    return getEmployeeByUserIdService(userId);
  };

  return (
    <EmployeeContext.Provider value={{
      employees,
      loading,
      addEmployee,
      updateEmployee,
      deactivateEmployee,
      deleteEmployee,
      getEmployeeById,
      getEmployeeByUserId,
      fetchEmployees
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = (): EmployeeContextType => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
