
import { Employee, EmploymentStatus } from '@/contexts/employee/types';
import { v4 as uuidv4 } from 'uuid';

// Define the types locally since they are not exported from contexts/employee/types
type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'consultant' | 'intern';
type DepartmentType = 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management' | 'it' | 'hr' | 'finance';

// Mock employees data for local storage (for when Supabase is not available/offline)
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    employeeType: 'permanent',
    department: 'teaching',
    joiningDate: '2023-01-15',
    status: 'active',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2023-01-15T08:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    employeeType: 'contract',
    department: 'admin',
    joiningDate: '2023-02-01',
    status: 'active',
    createdAt: '2023-02-01T08:00:00Z',
    updatedAt: '2023-02-01T08:00:00Z'
  }
];

// Local storage key for employees
const EMPLOYEES_STORAGE_KEY = 'eduSafe_employees';

// Utility functions

/**
 * Get all employees from local storage
 */
export const getEmployeesFromStorage = (): Employee[] => {
  try {
    const employeesJSON = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    return employeesJSON ? JSON.parse(employeesJSON) : DEFAULT_EMPLOYEES;
  } catch (error) {
    console.error("Error getting employees from storage:", error);
    return DEFAULT_EMPLOYEES;
  }
};

/**
 * Save employees to local storage
 */
export const saveEmployeesToStorage = (employees: Employee[]): void => {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (error) {
    console.error("Error saving employees to storage:", error);
  }
};

/**
 * Add a new employee
 */
export const addEmployee = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  const employees = getEmployeesFromStorage();
  
  // Check for duplicate employeeId or email
  const isDuplicate = employees.some(
    emp => emp.employeeId === employeeData.employeeId || emp.email === employeeData.email
  );
  
  if (isDuplicate) {
    throw new Error("An employee with this ID or email already exists");
  }
  
  const now = new Date().toISOString();
  const newEmployee: Employee = {
    ...employeeData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  
  employees.push(newEmployee);
  saveEmployeesToStorage(employees);
  
  return newEmployee;
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  const employees = getEmployeesFromStorage();
  const employeeIndex = employees.findIndex(emp => emp.id === id);
  
  if (employeeIndex === -1) {
    throw new Error("Employee not found");
  }
  
  // Check for duplicate employeeId or email
  if (updates.employeeId || updates.email) {
    const isDuplicate = employees.some(
      emp => emp.id !== id && (
        (updates.employeeId && emp.employeeId === updates.employeeId) || 
        (updates.email && emp.email === updates.email)
      )
    );
    
    if (isDuplicate) {
      throw new Error("Another employee with this ID or email already exists");
    }
  }
  
  const updatedEmployee: Employee = {
    ...employees[employeeIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  employees[employeeIndex] = updatedEmployee;
  saveEmployeesToStorage(employees);
  
  return updatedEmployee;
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (id: string): Promise<void> => {
  const employees = getEmployeesFromStorage();
  const filteredEmployees = employees.filter(emp => emp.id !== id);
  
  if (filteredEmployees.length === employees.length) {
    throw new Error("Employee not found");
  }
  
  saveEmployeesToStorage(filteredEmployees);
};

/**
 * Get employee by ID
 */
export const getEmployeeById = (id: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(emp => emp.id === id);
};

/**
 * Get employee by user ID
 */
export const getEmployeeByUserId = (userId: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(emp => emp.userId === userId);
};

/**
 * Get all employees
 */
export const getAllEmployees = (): Employee[] => {
  return getEmployeesFromStorage();
};

/**
 * Process bulk employee import from Excel/CSV
 */
export const processBulkEmployeeImport = (
  employeesData: Array<{
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeType: string;
    department: string;
    joiningDate: string;
    status: string;
  }>
): { success: Employee[], failures: { data: any, error: string }[] } => {
  const employees = getEmployeesFromStorage();
  const result: { success: Employee[], failures: { data: any, error: string }[] } = {
    success: [],
    failures: []
  };
  
  for (const data of employeesData) {
    try {
      // Basic validation
      if (!data.employeeId || !data.firstName || !data.lastName || !data.email) {
        throw new Error("Missing required fields");
      }
      
      // Check for duplicate employeeId or email
      const isDuplicate = employees.some(
        emp => emp.employeeId === data.employeeId || emp.email === data.email
      ) || result.success.some(
        emp => emp.employeeId === data.employeeId || emp.email === data.email
      );
      
      if (isDuplicate) {
        throw new Error("Duplicate employeeId or email");
      }
      
      // Validate types
      const employeeType = data.employeeType as EmployeeType;
      const department = data.department as DepartmentType;
      const status = (data.status || 'active') as EmploymentStatus;
      
      // Check if the employee type is valid
      const validEmployeeTypes: EmployeeType[] = ['permanent', 'contract', 'part_time', 'consultant', 'intern'];
      if (!validEmployeeTypes.includes(employeeType as EmployeeType)) {
        throw new Error(`Invalid employee type: ${data.employeeType}`);
      }
      
      // Check if the department is valid
      const validDepartments: DepartmentType[] = ['admin', 'teaching', 'security', 'maintenance', 'transport', 'management', 'it', 'hr', 'finance'];
      if (!validDepartments.includes(department as DepartmentType)) {
        throw new Error(`Invalid department: ${data.department}`);
      }
      
      // Create new employee
      const now = new Date().toISOString();
      const newEmployee: Employee = {
        id: uuidv4(),
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        employeeType,
        department,
        joiningDate: data.joiningDate || now.split('T')[0],
        status,
        createdAt: now,
        updatedAt: now
      };
      
      result.success.push(newEmployee);
    } catch (error) {
      result.failures.push({
        data,
        error: error.message
      });
    }
  }
  
  // Only update storage if there were successful imports
  if (result.success.length > 0) {
    saveEmployeesToStorage([...employees, ...result.success]);
  }
  
  return result;
};
