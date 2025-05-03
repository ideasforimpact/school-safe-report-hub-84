
export type UserRole = 'reporter' | 'admin' | 'saas_owner';

// Define module access permissions
export interface ModulePermissions {
  incidentReporting: boolean;
  allIncidents: boolean;
  insights: boolean;
  benchmarking: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  modulePermissions: ModulePermissions;
  clientId?: string; // Added clientId to associate users with clients
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
  addUser: (userData: { name: string; email: string; password: string; role: UserRole, modulePermissions: ModulePermissions, clientId?: string }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}
