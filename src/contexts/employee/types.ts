
import { ModulePermissions } from '../auth/types';

// Custom employee-specific types
export type EmploymentStatus = 'active' | 'on_leave' | 'resigned' | 'terminated' | 'retired' | 'inactive';
export type EmployeeGrade = 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
export type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'consultant' | 'intern';
export type DepartmentType = 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management' | 'it' | 'hr' | 'finance';

export interface Employee {
  id: string;
  userId?: string; // Link to auth user if applicable
  employeeId: string; // Employee number/code
  firstName: string;
  lastName: string;
  email: string;
  
  // Key employee information
  employeeType: EmployeeType;
  department: DepartmentType;
  joiningDate: string;
  status: EmploymentStatus;
  
  // Module permissions (now stored in employee_modules table but needed for UI)
  modulePermissions?: ModulePermissions;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeeByUserId: (userId: string) => Employee | undefined;
}
