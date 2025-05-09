
import { User, UserWithPassword, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { validateUserEmail, validateAdminDeletion } from '@/contexts/auth/utils';
import { toast } from "@/components/ui/sonner";

export const addNewUser = (
  users: UserWithPassword[],
  userData: { 
    firstName: string;
    lastName: string;
    email: string; 
    password: string; 
    role: UserRole; 
    modulePermissions: ModulePermissions;
    clientId?: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    isActive: boolean;
  },
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): UserWithPassword[] | null => {
  // Check if email already exists
  if (!validateUserEmail(users, userData.email)) {
    return null;
  }

  // If the user is being added with a client ID, validate the email domain
  if (userData.clientId && userData.role !== 'saas_owner' && isEmailDomainAllowed) {
    const isAllowed = isEmailDomainAllowed(userData.email, userData.clientId);
    if (!isAllowed) {
      toast.error(`The email domain isn't allowed for this client. Please use an approved domain.`);
      return null;
    }
  }

  const newUser: UserWithPassword = {
    id: Date.now().toString(),
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
    isActive: userData.isActive
  };

  const updatedUsers = [...users, newUser];
  toast.success("User added successfully");
  return updatedUsers;
};

export const updateExistingUser = (
  users: UserWithPassword[],
  id: string,
  updates: Partial<User & { password?: string }>
): UserWithPassword[] | null => {
  // Check if email already exists and it's not the current user
  if (updates.email && !validateUserEmail(users, updates.email, id)) {
    return null;
  }

  const updatedUsers = users.map(u => {
    if (u.id === id) {
      return { ...u, ...updates };
    }
    return u;
  });

  toast.success("User updated successfully");
  return updatedUsers;
};

export const deleteExistingUser = (
  users: UserWithPassword[],
  id: string,
  currentUserId: string | undefined
): UserWithPassword[] | null => {
  if (!validateAdminDeletion(users, id, currentUserId)) {
    return null;
  }

  const updatedUsers = users.filter(u => u.id !== id);
  toast.success("User deleted successfully");
  return updatedUsers;
};

export const deactivateExistingUser = (
  users: UserWithPassword[],
  id: string,
  currentUserId: string | undefined
): UserWithPassword[] | null => {
  if (!validateAdminDeletion(users, id, currentUserId)) {
    return null;
  }

  const updatedUsers = users.map(u => {
    if (u.id === id) {
      return { ...u, isActive: false };
    }
    return u;
  });

  toast.success("User deactivated successfully");
  return updatedUsers;
};
