
import { v4 as uuidv4 } from 'uuid';
import { Employee, EmploymentStatus } from '@/contexts/employee/types';

// Local storage key
const EMPLOYEES_STORAGE_KEY = 'employees';

// Get all employees from local storage
export const getEmployeesFromStorage = (): Employee[] => {
  try {
    const storedEmployees = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    return storedEmployees ? JSON.parse(storedEmployees) : [];
  } catch (error) {
    console.error("Error getting employees from storage:", error);
    return [];
  }
};

// Save employees to local storage
export const saveEmployeesToStorage = (employees: Employee[]): void => {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (error) {
    console.error("Error saving employees to storage:", error);
  }
};

// Add a new employee (for local storage fallback)
export const addEmployee = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  const newEmployee: Employee = {
    ...employeeData,
    id: uuidv4(),
    status: employeeData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return newEmployee;
};

// Update an existing employee (for local storage fallback)
export const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  const employees = getEmployeesFromStorage();
  const employeeIndex = employees.findIndex(emp => emp.id === id);
  
  if (employeeIndex === -1) {
    throw new Error(`Employee with ID ${id} not found`);
  }
  
  const updatedEmployee = {
    ...employees[employeeIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  employees[employeeIndex] = updatedEmployee;
  saveEmployeesToStorage(employees);
  
  return updatedEmployee;
};

// Delete an employee (for local storage fallback)
export const deleteEmployee = async (id: string): Promise<boolean> => {
  const employees = getEmployeesFromStorage();
  const updatedEmployees = employees.filter(emp => emp.id !== id);
  
  if (employees.length === updatedEmployees.length) {
    return false; // No employee was deleted
  }
  
  saveEmployeesToStorage(updatedEmployees);
  return true;
};

// Get employee by ID (helper function)
export const getEmployeeById = (id: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(emp => emp.id === id);
};

// Get employee by user ID (helper function)
export const getEmployeeByUserId = (userId: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(emp => emp.userId === userId);
};

// Get all employees
export const getAllEmployees = (): Employee[] => {
  return getEmployeesFromStorage();
};
