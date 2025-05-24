
import { User } from '@supabase/supabase-js';

// Update the AuthContextType to include the employeeData property
export interface AuthContextType {
  user: User | null;
  employeeData: EmployeeData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateEmployeeData: (newData: Partial<EmployeeData>) => void;
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
}

export interface UserWithPassword extends User {
  password: string;
}

export interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  position: string;
  employeeTypeId: string;
  employeeType: string;
  departmentId: string;
  department: string;
  userRoleId: string;
  userRole: { id: string; name: string };
  modulePermissions: ModulePermissions[];
  clientId: string | null;
  isSuperAdmin?: boolean;
  status: boolean;
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
