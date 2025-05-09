
import { User, UserWithPassword, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { v4 as uuidv4 } from 'uuid';
import { validateUserEmail, validateAdminDeletion } from '@/contexts/auth/utils';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

export const addNewUser = async (
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
): Promise<UserWithPassword[] | null> => {
  // Check if user with this email already exists
  const userExists = currentUsers.find(user => user.email === userData.email);
  if (userExists) {
    console.error("User with this email already exists");
    toast.error("User with this email already exists");
    return null;
  }
  
  // If this is a client user, validate against the allowed email domains
  if (userData.clientId && userData.email && isEmailDomainAllowed) {
    if (!isEmailDomainAllowed(userData.email, userData.clientId)) {
      console.error("Email domain not allowed for this client");
      toast.error("Email domain not allowed for this client");
      return null;
    }
  }

  // Store module permissions in database if provided
  try {
    if (userData.modulePermissions) {
      const moduleEntries = Object.entries(userData.modulePermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => ({
          module_key: key,
          enabled: true
        }));

      // This would be where you'd store the module permissions in a real backend
      console.log("Module permissions to be stored:", moduleEntries);
      
      // In a real implementation with Supabase, you would store these permissions
      // associated with the user ID after the user is created
    }
  } catch (error) {
    console.error("Error storing module permissions:", error);
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

export const updateExistingUser = async (
  currentUsers: UserWithPassword[],
  id: string,
  updates: Partial<User & { password?: string }>
): Promise<UserWithPassword[] | null> => {
  // Check if email already exists and it's not the current user
  if (updates.email && !validateUserEmail(currentUsers, updates.email, id)) {
    toast.error("Email already in use by another user");
    return null;
  }

  // Handle module permissions update
  try {
    if (updates.modulePermissions) {
      const moduleEntries = Object.entries(updates.modulePermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => ({
          module_key: key,
          enabled: true
        }));

      // This would be where you'd update the module permissions in a real backend
      console.log("Module permissions to be updated:", moduleEntries);
    }
  } catch (error) {
    console.error("Error updating module permissions:", error);
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
