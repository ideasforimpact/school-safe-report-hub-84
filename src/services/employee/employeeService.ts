
import { Employee, EmploymentStatus } from '@/contexts/employee/types';
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const EMPLOYEES_STORAGE_KEY = 'employees';

// Helper function to get employees from localStorage
export const getEmployeesFromStorage = (): Employee[] => {
  const employeesJson = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (employeesJson) {
    try {
      return JSON.parse(employeesJson);
    } catch (e) {
      console.error("Error parsing employees JSON:", e);
      return [];
    }
  }
  return [];
};

// Helper function to save employees to localStorage
export const saveEmployeesToStorage = (employees: Employee[]): void => {
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
};

// Get all employees (for when API is not available)
export const getAllEmployees = (): Employee[] => {
  return getEmployeesFromStorage();
};

// Add a new employee
export const addEmployee = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  const employees = getEmployeesFromStorage();
  
  // Check if an employee with the same employeeId or email already exists
  const existingEmployeeWithId = employees.find(e => 
    e.employeeId === employeeData.employeeId
  );
  if (existingEmployeeWithId) {
    throw new Error(`An employee with ID ${employeeData.employeeId} already exists.`);
  }
  
  const existingEmployeeWithEmail = employees.find(e => 
    e.email.toLowerCase() === employeeData.email.toLowerCase()
  );
  if (existingEmployeeWithEmail) {
    throw new Error(`An employee with email ${employeeData.email} already exists.`);
  }
  
  // Create new employee with ID and timestamps
  const now = new Date().toISOString();
  const newEmployee: Employee = {
    ...employeeData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  
  // Add to localStorage
  employees.push(newEmployee);
  saveEmployeesToStorage(employees);
  
  return newEmployee;
};

// Get employee by ID
export const getEmployeeById = (id: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(employee => employee.id === id);
};

// Get employee by user ID
export const getEmployeeByUserId = (userId: string): Employee | undefined => {
  const employees = getEmployeesFromStorage();
  return employees.find(employee => employee.userId === userId);
};

// Update an existing employee
export const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  const employees = getEmployeesFromStorage();
  
  // Find the employee to update
  const employeeIndex = employees.findIndex(employee => employee.id === id);
  if (employeeIndex === -1) {
    throw new Error(`Employee with ID ${id} not found.`);
  }
  
  // If updating email or employeeId, check for duplicates
  if (updates.email) {
    const existingWithEmail = employees.find(e => 
      e.email.toLowerCase() === updates.email!.toLowerCase() && e.id !== id
    );
    if (existingWithEmail) {
      throw new Error(`An employee with email ${updates.email} already exists.`);
    }
  }
  
  if (updates.employeeId) {
    const existingWithId = employees.find(e => 
      e.employeeId === updates.employeeId && e.id !== id
    );
    if (existingWithId) {
      throw new Error(`An employee with ID ${updates.employeeId} already exists.`);
    }
  }
  
  // Update the employee
  const updatedEmployee: Employee = {
    ...employees[employeeIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  employees[employeeIndex] = updatedEmployee;
  saveEmployeesToStorage(employees);
  
  return updatedEmployee;
};

// Delete an employee
export const deleteEmployee = async (id: string): Promise<void> => {
  let employees = getEmployeesFromStorage();
  
  const employeeIndex = employees.findIndex(employee => employee.id === id);
  if (employeeIndex === -1) {
    throw new Error(`Employee with ID ${id} not found.`);
  }
  
  employees = employees.filter(employee => employee.id !== id);
  saveEmployeesToStorage(employees);
};

// Helper function to convert employee type string to enum
export const employeeTypeFromString = (typeStr: string): string => {
  const validTypes = ['permanent', 'contract', 'part_time', 'consultant', 'intern'];
  return validTypes.includes(typeStr) ? typeStr : 'permanent';
};

// Helper function to convert department string to enum
export const departmentTypeFromString = (deptStr: string): string => {
  const validDepts = ['admin', 'teaching', 'security', 'maintenance', 'transport', 'management', 'it', 'hr', 'finance'];
  return validDepts.includes(deptStr) ? deptStr : 'admin';
};

// Helper function to convert employment status string to enum
export const employmentStatusFromString = (statusStr: string): EmploymentStatus => {
  const validStatus = ['active', 'on_leave', 'resigned', 'terminated', 'retired', 'inactive'];
  return (validStatus.includes(statusStr) ? statusStr : 'inactive') as EmploymentStatus;
};

// Import employees from Excel
export const importEmployeesFromExcel = async (employees: Partial<Employee>[]): Promise<Employee[]> => {
  const existingEmployees = getEmployeesFromStorage();
  const now = new Date().toISOString();
  
  const addedEmployees: Employee[] = [];
  
  for (const employeeData of employees) {
    // Skip if missing required fields
    if (!employeeData.employeeId || !employeeData.firstName || !employeeData.lastName || !employeeData.email || !employeeData.department || !employeeData.employeeType) {
      console.warn('Skipping employee import due to missing required fields', employeeData);
      continue;
    }
    
    // Check for duplicates
    const existingWithId = existingEmployees.find(e => e.employeeId === employeeData.employeeId);
    const existingWithEmail = existingEmployees.find(e => e.email.toLowerCase() === employeeData.email!.toLowerCase());
    
    if (existingWithId || existingWithEmail) {
      console.warn('Skipping duplicate employee', employeeData);
      continue;
    }
    
    // Create new employee with required fields
    const newEmployee: Employee = {
      id: uuidv4(),
      employeeId: employeeData.employeeId,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      employeeType: employeeData.employeeType,
      department: employeeData.department,
      joiningDate: employeeData.joiningDate || now.substring(0, 10),
      status: employeeData.status || 'active',
      userId: employeeData.userId,
      modulePermissions: employeeData.modulePermissions,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to the list
    existingEmployees.push(newEmployee);
    addedEmployees.push(newEmployee);
  }
  
  // Save updated list
  saveEmployeesToStorage(existingEmployees);
  
  return addedEmployees;
};
