
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

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize employees from storage
  useEffect(() => {
    const storedEmployees = getEmployeesFromStorage();
    setEmployees(storedEmployees);
    setLoading(false);
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
      const newEmployee = await addEmployeeService(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
    } catch (error) {
      console.error("Error in addEmployee:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      setLoading(true);
      const updatedEmployee = await updateEmployeeService(id, updates);
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
    } catch (error) {
      console.error("Error in updateEmployee:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      setLoading(true);
      await deleteEmployeeService(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
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
