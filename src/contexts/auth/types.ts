
export type UserRole = 'user' | 'admin' | 'reporter' | 'saas_owner';

export type DepartmentType = 'Admin' | 'Teaching' | 'Support' | 'Tech' | 'Management' | 'Security' | 'maintenance' | 'transport';

export type EmployeeType = 'permanent' | 'contract' | 'temporary' | 'intern' | 'part_time' | 'consultant';

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

export interface Module {
  id: string;
  name: string;
  icon: string;
  level: string;
  created_at?: string;
  updated_at?: string;
  key?: string;
  active?: boolean;
  description?: string;
  access_level?: {
    isAdmin?: boolean;
    isEnabled?: boolean;
    [key: string]: any;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  modulePermissions: ModulePermissions;
  clientId?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
  modules?: Module[]; // Add modules array to store client module information
  
  // Add the missing properties
  employeeId?: string;
  employeeType?: EmployeeType;
  department?: DepartmentType;
  joiningDate?: string;
}

export interface UserWithPassword extends User {
  password: string;
}

// This is needed by the AuthProvider component
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSaasOwner: boolean;
  isLoading: boolean;
  users: User[];
  authError?: string | null;
  login: (email: string, password: string) => Promise<boolean>; // Changed to return Promise<boolean>
  logout: () => Promise<void>;
  getRequiredPermission: (module: string) => string;
  registerUser: (userData: Omit<UserWithPassword, 'id'>) => Promise<void>;
  updateUserInfo: (userId: string, userData: Partial<User>) => Promise<void>;
  googleSignIn: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>; // Changed to return Promise<boolean>
  addUser?: (userData: Omit<UserWithPassword, 'id'>) => Promise<void>;
  handleUserAuthentication?: (supabaseUser: any) => Promise<void>; // Add this missing property
}
