
// Define the user with password separately for internal use
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
  reactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  authError: string | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  modulePermissions?: ModulePermissions;
  isActive: boolean;
  clientId?: string;
  employeeId?: string;
  employeeType?: EmployeeType;
  department?: DepartmentType;
  joiningDate?: string;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'reporter' | 'viewer' | 'saas_owner';

export type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'consultant';

export type DepartmentType = 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management';

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
