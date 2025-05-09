
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
  updateModulePermissionsInApi
} from '@/services/employee/employeeApiService';

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize employees from storage
  useEffect(() => {
    const initializeEmployees = async () => {
      try {
        setLoading(true);
        // First try to get employees from the API
        const apiEmployees = await getAllEmployeesFromApi().catch(() => null);
        
        if (apiEmployees && apiEmployees.length > 0) {
          setEmployees(apiEmployees);
        } else {
          // Fallback to local storage if API fails
          const storedEmployees = getEmployeesFromStorage();
          setEmployees(storedEmployees);
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

    initializeEmployees();
  }, []);

  // Save employees to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      saveEmployeesToStorage(employees);
    }
  }, [employees, loading]);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      
      // Try to add employee to API first
      try {
        const newEmployee = await addEmployeeToApi(employeeData);
        setEmployees(prev => [...prev, newEmployee]);
        return;
      } catch (apiError) {
        console.error("API error in addEmployee, falling back to local:", apiError);
        
        // If API fails, fallback to local storage
        const newEmployee = await addEmployeeService(employeeData);
        setEmployees(prev => [...prev, newEmployee]);
      }
    } catch (error) {
      console.error("Error in addEmployee:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      setLoading(true);
      
      // Try to update employee in API first
      try {
        const updatedEmployee = await updateEmployeeInApi(id, updates);
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

  const deactivateEmployee = async (id: string) => {
    try {
      setLoading(true);
      
      // Try to deactivate employee in API first
      try {
        const deactivatedEmployee = await deactivateEmployeeInApi(id);
        setEmployees(prev => prev.map(emp => emp.id === id ? deactivatedEmployee : emp));
        return;
      } catch (apiError) {
        console.error("API error in deactivateEmployee, falling back to local:", apiError);
        
        // If API fails, fallback to local storage
        await updateEmployeeService(id, { status: 'inactive' });
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, status: 'inactive' } : emp));
      }
    } catch (error) {
      console.error("Error in deactivateEmployee:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      setLoading(true);
      
      // Try to delete employee from API first
      try {
        await deleteEmployeeFromApi(id);
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        return;
      } catch (apiError) {
        console.error("API error in deleteEmployee, falling back to local:", apiError);
        
        // If API fails, fallback to local storage
        await deleteEmployeeService(id);
        setEmployees(prev => prev.filter(emp => emp.id !== id));
      }
    } catch (error) {
      console.error("Error in deleteEmployee:", error);
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
      getEmployeeByUserId
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
