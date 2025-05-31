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

  try {
    // In a real implementation with Supabase, we would store the user data
    // This is where you could add Supabase integration for persisting the user
    // const { data, error } = await supabase.auth.signUp({
    //   email: userData.email,
    //   password: userData.password,
    //   options: {
    //     data: {
    //       firstName: userData.firstName,
    //       lastName: userData.lastName,
    //       role: userData.role,
    //       employeeId: userData.employeeId,
    //       employeeType: userData.employeeType,
    //       department: userData.department,
    //       joiningDate: userData.joiningDate,
    //       clientId: userData.clientId,
    //       isActive: userData.isActive
    //     }
    //   }
    // });
    
    // Module permissions would be stored in the user's metadata in a real implementation
    if (userData.modulePermissions) {
      const moduleEntries = Object.entries(userData.modulePermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => key);

      //console.log("Module permissions to be stored for employee:", moduleEntries);
      
      // For a real backend, you would save these permissions to user metadata or a related table
      // This could be done via hooks or triggers in a production Supabase implementation
    }
  } catch (error) {
    console.error("Error saving employee data:", error);
    toast.error("Failed to save employee data");
    return null;
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

  try {
    // In a real implementation with Supabase, we would update the user and their module permissions
    
    // Handle module permissions update
    if (updates.modulePermissions) {
      const moduleEntries = Object.entries(updates.modulePermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => key);

      //console.log("Module permissions to be updated for employee:", moduleEntries);
      
      // For a real backend implementation, you would update the user's permissions here
      // await supabase.from('user_metadata').update({ modulePermissions: updates.modulePermissions }).eq('user_id', id);
    }

    // Update other user data
    // In a real implementation, you would update the user's data in Supabase
    // Example:
    // await supabase.auth.admin.updateUserById(id, {
    //   email: updates.email,
    //   user_metadata: {
    //     firstName: updates.firstName,
    //     lastName: updates.lastName,
    //     role: updates.role,
    //     // Other fields...
    //   }
    // });
  } catch (error) {
    console.error("Error updating employee data:", error);
    toast.error("Failed to update employee data");
    return null;
  }

  const updatedUsers = currentUsers.map(u => {
    if (u.id === id) {
      return { ...u, ...updates };
    }
    return u;
  });

  toast.success("Employee updated successfully");
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

  try {
    // In a real implementation with Supabase, we would delete the user
    // Example:
    // await supabase.auth.admin.deleteUser(id);
    
    //console.log("Employee deleted:", id);
  } catch (error) {
    console.error("Error deleting employee:", error);
    toast.error("Failed to delete employee");
    return null;
  }

  const updatedUsers = currentUsers.filter(u => u.id !== id);
  toast.success("Employee deleted successfully");
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

  try {
    // In a real implementation with Supabase, we would deactivate the user
    // Example:
    // await supabase.auth.admin.updateUserById(id, { 
    //   user_metadata: { isActive: false } 
    // });
    
    //console.log("Employee deactivated:", id);
  } catch (error) {
    console.error("Error deactivating employee:", error);
    toast.error("Failed to deactivate employee");
    return null;
  }

  const updatedUsers = currentUsers.map(u => {
    if (u.id === id) {
      return { ...u, isActive: false };
    }
    return u;
  });

  toast.success("Employee deactivated successfully");
  return updatedUsers;
};

export const reactivateExistingUser = (
  currentUsers: UserWithPassword[],
  id: string,
  currentUserId?: string
): UserWithPassword[] | null => {
  try {
    // In a real implementation with Supabase, we would reactivate the user
    // Example:
    // await supabase.auth.admin.updateUserById(id, { 
    //   user_metadata: { isActive: true } 
    // });
    
    //console.log("Employee reactivated:", id);
  } catch (error) {
    console.error("Error reactivating employee:", error);
    toast.error("Failed to reactivate employee");
    return null;
  }

  const updatedUsers = currentUsers.map(u => {
    if (u.id === id) {
      return { ...u, isActive: true };
    }
    return u;
  });

  toast.success("Employee reactivated successfully");
  return updatedUsers;
};

export const fetchEmployeeModules = async (userId: string): Promise<ModulePermissions | null> => {
  try {
    // In a real Supabase implementation, we would fetch the user's modules
    // Example:
    // const { data, error } = await supabase
    //   .from('user_metadata')
    //   .select('modulePermissions')
    //   .eq('user_id', userId)
    //   .single();
    
    // if (error) throw error;
    // return data.modulePermissions;
    
    //console.log("Fetching modules for employee:", userId);
    
    // For demo purposes, return default permissions
    return {
      superAdmin: false,
      incidentReporting: true,
      incidentAdmin: false,
      assessmentUser: true,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: true
    };
  } catch (error) {
    console.error("Error fetching employee modules:", error);
    toast.error("Failed to load employee module permissions");
    return null;
  }
};
