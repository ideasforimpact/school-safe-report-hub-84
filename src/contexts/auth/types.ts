
// Update the AuthContextType to include the employeeData property
export interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSaasOwner: boolean;
  addUser: (userData: any) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  authError: string | null;
  handleUserAuthentication: (supabaseUser: any) => Promise<void>;
  employeeData: EmployeeData | null;
}

export type UserRole = 'user' | 'admin' | 'reporter' | 'viewer' | 'saas_owner';
export type EmployeeType = 'permanent' | 'contract' | 'part_time' | 'full-time' | 'consultant' | 'admin';
export type DepartmentType = 'IT' | 'HR' | 'Finance' | 'Marketing' | 'Operations' | 'Other' | 'Teaching' | 
  'Administrative' | 'Support' | 'admin' | 'teaching' | 'security' | 'maintenance' | 'transport' | 
  'management' | 'Management';

// Define a ModulePermissions interface
export interface ModulePermissions {
  superAdmin?: boolean;
  userManagement?: boolean;
  clientManagement?: boolean;
  employeeVerification?: boolean;
  employeeVerificationAdmin?: boolean;
  incidentReporting?: boolean;
  incidentAdmin?: boolean;
  transportSafety?: boolean;
  transportSafetyAdmin?: boolean;
  assessmentUser?: boolean;
  assessmentsAdmin?: boolean;
  grievancesAdmin?: boolean;
  eduSafeResourceAccess?: boolean;
  incidents?: boolean;
  assessments?: boolean;
  reports?: boolean;
  edusafe?: boolean;
  transport?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  modulePermissions?: ModulePermissions;
  createdAt?: string;
  updatedAt?: string;
  provider?: string;
  clientId?: string | null;
  employeeId?: string;
  employeeType?: EmployeeType;
  department?: DepartmentType;
  joiningDate?: string;
  isSuperAdmin?: boolean;
  client?: Client | null;
  clientType?: ClientType | null;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface ClientType {
  id: string;
  name: string;
  key: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  allowed_domains?: string;
  super_admin_allowed_domain?: string;
  auth_providers?: string;
  creation_date: string;
  active: boolean;
  client_type_id?: string;
  institution_type?: string;
  logo?: string;
  client_type?: ClientType;
}

export interface EmployeeData {
  id: string;
  clientId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  isSuperAdmin: boolean;
  department: { id: string; name: string; } | null;
  employeeType: { id: string; name: string; } | null;
  client?: Client | null;
  clientType?: ClientType | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthAction {
  type: string;
  payload?: any;
}
