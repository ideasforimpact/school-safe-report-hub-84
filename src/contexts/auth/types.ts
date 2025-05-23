
// User roles
export type UserRole = 'admin' | 'reporter' | 'user' | 'saas_owner';

// Employee types
export type EmployeeType = 'permanent' | 'temporary' | 'contract' | 'consultant' | 'part_time';

// Department types
export type DepartmentType = 'admin' | 'academics' | 'operations' | 'teaching' | 'security' | 'maintenance' | 'transport' | 'management';

// Module permissions interface
export interface ModulePermissions {
  incidents: boolean;
  assessments: boolean;
  reports: boolean;
  edusafe: boolean;
  transport: boolean;
  [key: string]: boolean;
}

// Employee data
export interface EmployeeData {
  id: string;
  name: string;
  role: string;
  department?: DepartmentType;
  employeeType?: EmployeeType;
}

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  employeeType?: EmployeeType;
  department?: DepartmentType;
  joiningDate?: string;
  clientId?: string;
  role: UserRole;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  modulePermissions?: ModulePermissions;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  users: User[];
  isAdmin: boolean;
  isSaasOwner: boolean;
  authError: string | null;
  employeeData: EmployeeData | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (userData: Partial<User>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  handleUserAuthentication: (userData: any) => Promise<void>;
}

// Auth provider props
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth action types
export type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_SUPER_ADMIN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_USER'; payload: User | null };
