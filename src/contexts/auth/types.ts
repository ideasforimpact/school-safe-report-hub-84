
export type UserRole = 'user' | 'admin' | 'reporter' | 'saas_owner';

export type DepartmentType = 'Admin' | 'Teaching' | 'Support' | 'Tech' | 'Management' | 'Security';

export type EmployeeType = 'permanent' | 'contract' | 'temporary' | 'intern';

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
}

export interface UserWithPassword extends User {
  password: string;
}
