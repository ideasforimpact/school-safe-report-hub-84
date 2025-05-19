
// Add the provider field to User type
export type UserRole = 'admin' | 'user' | 'reporter' | 'supervisor' | 'saas_owner' | 'client_admin';
export type EmployeeType = 'teaching' | 'non-teaching' | 'contract' | 'part_time' | 'consultant' | 'intern' | 'admin' | 'permanent';
export type DepartmentType = 'academic' | 'administration' | 'finance' | 'hr' | 'it' | 'maintenance' | 'security' | 'transportation' | 'other' | 'Admin' | 'Teaching' | 'Security' | 'Management' | 'Tech' | 'transport' | 'Support';

// Define permissions for different modules
export interface ModulePermissions {
  superAdmin?: boolean;
  incidentReporting?: boolean;
  incidentAdmin?: boolean;
  assessmentUser?: boolean;
  assessmentsAdmin?: boolean;
  employeeVerificationAdmin?: boolean;
  grievancesAdmin?: boolean;
  transportSafetyAdmin?: boolean;
  eduSafeResourceAccess?: boolean;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  clientId?: string;
  modulePermissions?: ModulePermissions;
  customClaims?: Record<string, any>;
  modules?: any[]; // Array of modules the user has access to
  provider?: string; // Added provider field to track authentication method
  employeeId?: string; // Added missing field
  employeeType?: EmployeeType; // Added missing field
  department?: DepartmentType; // Added missing field
  joiningDate?: string; // Added missing field
  createdAt?: string; // Added missing field
}

export interface UserWithPassword extends User {
  password: string;
  employeeId?: string;
  employeeType?: EmployeeType;
  department?: DepartmentType;
  joiningDate?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSaasOwner: boolean;
  isLoading: boolean;
  users: User[];
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getRequiredPermission: (module: string) => string;
  registerUser: (userData: Omit<User & { password: string }, 'id'>) => Promise<void>;
  updateUserInfo: (userId: string, userData: Partial<User>) => Promise<void>;
  googleSignIn: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  addUser: (userData: Omit<UserWithPassword, 'id'>) => Promise<void>;
  handleUserAuthentication: (user: any) => Promise<void>;
}
