import { User, UserWithPassword, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { v4 as uuidv4 } from 'uuid';
import { validateUserEmail, validateAdminDeletion } from '@/contexts/auth/utils';
import { toast } from "@/components/ui/sonner";

export const addNewUser = (
  currentUsers: UserWithPassword[],
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
    clientId?: string;
    isActive: boolean;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
  },
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): UserWithPassword[] | null => {
  // Check if user with this email already exists
  const userExists = currentUsers.find(user => user.email === userData.email);
  if (userExists) {
    console.error("User with this email already exists");
    return null;
  }
  
  // If this is a client user, validate against the allowed email domains
  if (userData.clientId && userData.email && isEmailDomainAllowed) {
    if (!isEmailDomainAllowed(userData.email, userData.clientId)) {
      console.error("Email domain not allowed for this client");
      return null;
    }
  }

  const newUser: UserWithPassword = {
    id: uuidv4(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    modulePermissions: userData.modulePermissions,
    clientId: userData.clientId,
    employeeId: userData.employeeId,
    employeeType: userData.employeeType,
    department: userData.department,
    joiningDate: userData.joiningDate,
    isActive: userData.isActive,
    createdAt: new Date().toISOString(),
  };

  return [...currentUsers, newUser];
};

export const updateExistingUser = (
  currentUsers: UserWithPassword[],
  id: string,
  updates: Partial<User & { password?: string }>
): UserWithPassword[] | null => {
  // Check if email already exists and it's not the current user
  if (updates.email && !validateUserEmail(currentUsers, updates.email, id)) {
    return null;
  }

  const updatedUsers = currentUsers.map(u => {
    if (u.id === id) {
      return { ...u, ...updates };
    }
    return u;
  });

  toast.success("User updated successfully");
  return updatedUsers;
};

export const deleteExistingUser = (
  currentUsers: UserWithPassword[],
  id: string,
  currentUserId?: string
): UserWithPassword[] | null => {
  if (!validateAdminDeletion(currentUsers, id, currentUserId)) {
    return null;
  }

  const updatedUsers = currentUsers.filter(u => u.id !== id);
  toast.success("User deleted successfully");
  return updatedUsers;
};

export const deactivateExistingUser = (
  currentUsers: UserWithPassword[],
  id: string,
  currentUserId?: string
): UserWithPassword[] | null => {
  if (!validateAdminDeletion(currentUsers, id, currentUserId)) {
    return null;
  }

  const updatedUsers = currentUsers.map(u => {
    if (u.id === id) {
      return { ...u, isActive: false };
    }
    return u;
  });

  toast.success("User deactivated successfully");
  return updatedUsers;
};
