
export interface ModulePermissions {
  superAdmin: boolean;
  incidentReporting: boolean;
  incidentAdmin: boolean;
  assessmentUser: boolean;
  assessmentsAdmin: boolean;
  employeeVerificationAdmin: boolean;
  grievancesAdmin: boolean;
  transportSafetyAdmin: boolean;
  eduSafeResourceAccess: boolean;
}

export type UserRole = 'admin' | 'user' | 'saas_owner' | 'reporter';
export type EmployeeType = 'permanent' | 'temporary' | 'contract';
export type DepartmentType = 'admin' | 'academics' | 'operations';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  modulePermissions: ModulePermissions;
  clientId?: string;
  employeeId?: string;
  employeeType?: EmployeeType; 
  department?: DepartmentType;
  joiningDate?: string;
  isActive: boolean;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSaasOwner: boolean;
  addUser: (userData: { 
    firstName: string;
    lastName: string;
    email: string; 
    password: string; 
    role: UserRole; 
    modulePermissions: ModulePermissions;
    clientId?: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
  }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}
