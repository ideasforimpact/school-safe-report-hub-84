
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  modulePermissions?: ModulePermissions;
  createdAt?: string;
}

export interface UserWithPassword extends User {
  password: string;
}

export type UserRole = 'admin' | 'user' | 'saas_owner';

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
  [key: string]: boolean | undefined;
}

export interface ClientInfo {
  id: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  active: boolean;
  logo?: string;
  institution_type?: string;
  client_type_id?: string;
  allowed_domains?: string;
  super_admin_allowed_domain?: string;
  auth_providers?: string;
}

export interface ClientTypeInfo {
  id: string;
  name: string;
  key: string;
}

export interface EmployeeData {
  id: string;
  clientId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin?: boolean;
  department?: string;
  employeeType?: string;
  client?: ClientInfo | null;
  clientType?: ClientTypeInfo | null;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSaasOwner: boolean;
  addUser: (userData: Omit<User, 'id' | 'isActive'> & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  authError: string | null;
  handleUserAuthentication: (user: any) => Promise<void>;
  employeeData: EmployeeData | null;
}

// Define the SupabaseUser type
interface SupabaseUser {
  id: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
  email?: string;
  created_at?: string;
}
