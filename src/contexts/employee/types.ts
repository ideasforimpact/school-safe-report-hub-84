
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  clientId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  isSuperAdmin?: boolean;
  modulePermissions?: {
    [key: string]: boolean;
  };
  moduleAccessPayload?: Array<{
    name: string;
    employeeId: string;
    key: string;
    module_id?: string;
  }>;
}

export interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<{ success: boolean, error?: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean, error?: string }>;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeeByUserId: (userId: string) => Employee | undefined;
  fetchEmployees: () => Promise<void>;
}
