
export interface ModulePermissions {
  incidentReporting: boolean;
  allIncidents: boolean;
  insights: boolean;
  benchmarking: boolean;
}

export type UserRole = 'admin' | 'user' | 'saas_owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  modulePermissions: ModulePermissions;
  clientId?: string; // Optional client ID to associate user with a client
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
    name: string; 
    email: string; 
    password: string; 
    role: UserRole; 
    modulePermissions: ModulePermissions;
    clientId?: string;
  }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}
