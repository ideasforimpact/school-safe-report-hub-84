
import { ModuleAccessItem } from '@/types/moduleAccess';

export type EmploymentStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';
export type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'consultant' | 'intern';
export type DepartmentType = 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management' | 'it' | 'hr' | 'finance';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  status: boolean | EmploymentStatus;
  employeeType: EmployeeType;
  department: DepartmentType;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  isSuperAdmin?: boolean;
  user_id?: string; // Added to link to auth users
  moduleAccessPayload?: ModuleAccessItem[];
}

export interface EmployeeContextProps {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<{success: boolean; error?: string}>;
  deactivateEmployee: (id: string) => Promise<{success: boolean; error?: string}>;
}
