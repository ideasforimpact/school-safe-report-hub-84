
import { Employee, EmployeeApplicationFields } from '@/contexts/employee/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

// Mock storage for demo purposes
let employees: Employee[] = [];

// Storage helper functions
export const getEmployeesFromStorage = (): Employee[] => {
  const storedEmployees = localStorage.getItem('employees');
  if (!storedEmployees) return [];
  try {
    return JSON.parse(storedEmployees);
  } catch (error) {
    return [];
  }
};

export const saveEmployeesToStorage = (employees: Employee[]): void => {
  localStorage.setItem('employees', JSON.stringify(employees));
};

// Initialize employees from storage
employees = getEmployeesFromStorage();

// CRUD operations for employees
export const addEmployee = async (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> => {
  // Check if employee with this employee ID already exists
  if (employees.some(emp => emp.employeeId === employeeData.employeeId)) {
    toast.error("Employee with this ID already exists");
    throw new Error("Employee with this ID already exists");
  }
  
  // Check if employee with this email already exists
  if (employees.some(emp => emp.email === employeeData.email)) {
    toast.error("Employee with this email already exists");
    throw new Error("Employee with this email already exists");
  }

  try {
    // In a real implementation with Supabase, we would store the employee data
    // const { data, error } = await supabase
    //   .from('employees')
    //   .insert([{
    //     employee_id: employeeData.employeeId,
    //     first_name: employeeData.firstName,
    //     last_name: employeeData.lastName,
    //     email: employeeData.email,
    //     phone: employeeData.phone,
    //     employee_type: employeeData.employeeType,
    //     department: employeeData.department,
    //     joining_date: employeeData.joiningDate,
    //     status: employeeData.status,
    //     user_id: employeeData.userId,
    //     application_fields: employeeData.applicationFields
    //   }])
    //   .select()
    //   .single();
    
    // if (error) throw error;
    
    const now = new Date().toISOString();
    
    const newEmployee: Employee = {
      id: uuidv4(),
      ...employeeData,
      createdAt: now,
      updatedAt: now
    };

    // Add to local storage
    employees = [...employees, newEmployee];
    saveEmployeesToStorage(employees);
    
    toast.success("Employee added successfully");
    return newEmployee;
  } catch (error) {
    console.error("Error adding employee:", error);
    toast.error("Failed to add employee");
    throw error;
  }
};

export const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
): Promise<Employee> => {
  // Find the employee
  const employee = employees.find(emp => emp.id === id);
  if (!employee) {
    toast.error("Employee not found");
    throw new Error("Employee not found");
  }
  
  // Check if updating email to one that already exists
  if (updates.email && updates.email !== employee.email) {
    if (employees.some(emp => emp.email === updates.email && emp.id !== id)) {
      toast.error("Another employee with this email already exists");
      throw new Error("Another employee with this email already exists");
    }
  }
  
  // Check if updating employee ID to one that already exists
  if (updates.employeeId && updates.employeeId !== employee.employeeId) {
    if (employees.some(emp => emp.employeeId === updates.employeeId && emp.id !== id)) {
      toast.error("Another employee with this ID already exists");
      throw new Error("Another employee with this ID already exists");
    }
  }

  try {
    // In a real implementation with Supabase, we would update the employee data
    // const { data, error } = await supabase
    //   .from('employees')
    //   .update({
    //     employee_id: updates.employeeId,
    //     first_name: updates.firstName,
    //     last_name: updates.lastName,
    //     email: updates.email,
    //     phone: updates.phone,
    //     employee_type: updates.employeeType,
    //     department: updates.department,
    //     joining_date: updates.joiningDate,
    //     status: updates.status,
    //     application_fields: updates.applicationFields
    //   })
    //   .eq('id', id)
    //   .select()
    //   .single();
    
    // if (error) throw error;
    
    const updatedEmployee = {
      ...employee,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Update local storage
    employees = employees.map(emp => emp.id === id ? updatedEmployee : emp);
    saveEmployeesToStorage(employees);
    
    toast.success("Employee updated successfully");
    return updatedEmployee;
  } catch (error) {
    console.error("Error updating employee:", error);
    toast.error("Failed to update employee");
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    // In a real implementation with Supabase, we would delete the employee data
    // const { error } = await supabase
    //   .from('employees')
    //   .delete()
    //   .eq('id', id);
    
    // if (error) throw error;
    
    // Update local storage
    employees = employees.filter(emp => emp.id !== id);
    saveEmployeesToStorage(employees);
    
    toast.success("Employee deleted successfully");
  } catch (error) {
    console.error("Error deleting employee:", error);
    toast.error("Failed to delete employee");
    throw error;
  }
};

export const getEmployeeById = (id: string): Employee | undefined => {
  return employees.find(emp => emp.id === id);
};

export const getEmployeeByUserId = (userId: string): Employee | undefined => {
  return employees.find(emp => emp.userId === userId);
};

export const getAllEmployees = (): Employee[] => {
  return [...employees];
};

export const updateModulePermissions = async (
  id: string, 
  modulePermissions: Record<string, boolean>
): Promise<Employee | null> => {
  try {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) {
      throw new Error("Employee not found");
    }
    
    const appFields: EmployeeApplicationFields = employee.applicationFields || {};
    
    const updatedApplicationFields = {
      ...appFields,
      modulePermissions: {
        ...(appFields.modulePermissions || {}),
        ...modulePermissions
      }
    };
    
    return await updateEmployee(id, {
      applicationFields: updatedApplicationFields
    });
  } catch (error) {
    console.error("Error updating module permissions:", error);
    toast.error("Failed to update module permissions");
    return null;
  }
};
