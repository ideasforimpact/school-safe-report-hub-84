
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeType: EmployeeType;
  department: DepartmentType;
  joiningDate: string;
  status: EmploymentStatus;
  clientId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  isSuperAdmin?: boolean;
  modulePermissions?: {
    [key: string]: boolean;
  };
  moduleAccessPayload?: ModuleAccessItem[];
}

export type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'part-time' | 'consultant' | 'intern';

export type DepartmentType = 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management' | 'it' | 'hr' | 'finance';

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';

export interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string;
  module_id: string;
}

export interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>; // Changed from Promise<void> to Promise<Employee>
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<{ success: boolean, error?: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean, error?: string }>;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeeByUserId: (userId: string) => Employee | undefined;
  fetchEmployees: () => Promise<void>;
}
