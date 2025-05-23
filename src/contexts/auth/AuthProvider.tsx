import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Employee, employeeService } from '@/services/employeeService';
import { toast } from 'sonner';
import { employeeReducer } from './employeeReducer';

interface AuthContextProps {
  employeeData: Employee | null;
  employees: Employee[];
  loading: boolean;
  setEmployeeData: React.Dispatch<React.SetStateAction<Employee | null>>;
  handleUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  handleDeleteEmployee: (id: string) => Promise<void>;
}

interface EmployeeAction {
  type: 'SET_EMPLOYEES' | 'ADD_EMPLOYEE' | 'UPDATE_EMPLOYEE' | 'DELETE_EMPLOYEE';
  payload: Employee | string | Employee[];
}

export const AuthContext = createContext<AuthContextProps>({
  employeeData: null,
  employees: [],
  loading: false,
  setEmployeeData: () => {},
  handleUpdateEmployee: async () => {},
  handleDeleteEmployee: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const dispatch = useCallback((action: EmployeeAction) => {
    setEmployees(prev => employeeReducer(prev, action));
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        // Retrieve employee data from local storage
        const storedEmployeeData = localStorage.getItem('employeeData');
        if (storedEmployeeData) {
          const employee = JSON.parse(storedEmployeeData);
          setEmployeeData(employee);
        }
      } catch (error) {
        console.error('Error fetching employee data from local storage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  useEffect(() => {
    // Update local storage when employeeData changes
    if (employeeData) {
      localStorage.setItem('employeeData', JSON.stringify(employeeData));
    } else {
      localStorage.removeItem('employeeData');
    }
  }, [employeeData]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const fetchedEmployees = await employeeService.getEmployees();
        if (fetchedEmployees) {
          dispatch({ type: 'SET_EMPLOYEES', payload: fetchedEmployees });
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [dispatch]);

  const handleUpdateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const updatedEmployee = await employeeService.updateEmployee(id, updates);
      if (updatedEmployee) {
        dispatch({
          type: 'UPDATE_EMPLOYEE',
          payload: updatedEmployee
        });
        toast.success('Employee updated successfully');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  }, [dispatch]);

  const handleDeleteEmployee = useCallback(async (id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      dispatch({
        type: 'DELETE_EMPLOYEE',
        payload: id
      });
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  }, [dispatch]);

  const contextValue: AuthContextProps = {
    employeeData,
    employees,
    loading,
    setEmployeeData,
    handleUpdateEmployee,
    handleDeleteEmployee,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
