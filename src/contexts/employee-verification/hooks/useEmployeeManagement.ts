
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Employee } from '@/types/employeeVerification';
import { initialEmployees } from '../initialData';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    setEmployees([...employees, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
    ));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
};
