
import { User, UserWithPassword } from '@/contexts/auth/types';
import { excludePasswordFromUser } from '@/contexts/auth/utils';
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';
import { toast } from "@/components/ui/sonner";

// Keys for localStorage
const USER_STORAGE_KEY = 'userSession';
const USERS_STORAGE_KEY = 'usersList';

// Initialize mock users if they don't exist
export const initializeUsers = () => {
  const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!savedUsers) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
  } else {
    // Check for possible migration from old to new data structure
    try {
      const parsedUsers = JSON.parse(savedUsers) as UserWithPassword[];
      const needsMigration = parsedUsers.some(user => !('isActive' in user) || !('firstName' in user));
      
      if (needsMigration) {
        console.log("Migrating user data to new structure");
        const migratedUsers = parsedUsers.map(user => {
          // If user has old structure, migrate to new structure
          if (!('isActive' in user)) {
            return {
              ...user,
              isActive: true
            };
          }
          
          // If user uses name instead of firstName/lastName
          if (!('firstName' in user) && 'name' in user) {
            const nameParts = (user as any).name.split(' ');
            return {
              ...user,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              // Make sure isActive is set
              isActive: user.isActive ?? true
            };
          }
          
          return user;
        });
        
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migratedUsers));
        return migratedUsers;
      }
    } catch (error) {
      console.error("Error migrating user data:", error);
    }
  }
  
  return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]') as UserWithPassword[];
};

export const getUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error retrieving user from storage:", error);
    return null;
  }
};

export const getUsersFromStorage = (): UserWithPassword[] => {
  return initializeUsers();
};

export const saveUserToStorage = (user: User): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const saveUsersToStorage = (users: UserWithPassword[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const loginUser = async (
  email: string, 
  password: string, 
  users: UserWithPassword[],
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): Promise<User | null> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find user with matching email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      toast.error("Invalid email or password.");
      return null;
    }
    
    // Check password
    if (user.password !== password) {
      toast.error("Invalid email or password.");
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      toast.error("This account has been deactivated. Please contact an administrator.");
      return null;
    }
    
    // Check if email domain is allowed for client
    if (user.clientId && isEmailDomainAllowed && user.role !== 'saas_owner') {
      const isAllowed = isEmailDomainAllowed(email, user.clientId);
      if (!isAllowed) {
        toast.error("Your email domain is not allowed for this client.");
        return null;
      }
    }
    
    toast.success(`Welcome back, ${user.firstName}!`);
    
    // Return user object without password
    return excludePasswordFromUser(user);
  } catch (error) {
    toast.error("An error occurred during login.");
    console.error("Login error:", error);
    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
  toast.success("Logged out successfully");
};

export const changeUserPassword = (
  users: UserWithPassword[],
  userId: string,
  currentPassword: string,
  newPassword: string
): UserWithPassword[] | null => {
  try {
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      toast.error("User not found.");
      return null;
    }
    
    const user = users[userIndex];
    
    if (user.password !== currentPassword) {
      toast.error("Current password is incorrect.");
      return null;
    }
    
    const updatedUser: UserWithPassword = {
      ...user,
      password: newPassword
    };
    
    const updatedUsers = [...users];
    updatedUsers[userIndex] = updatedUser;
    
    toast.success("Password changed successfully.");
    
    return updatedUsers;
  } catch (error) {
    toast.error("An error occurred while changing password.");
    console.error("Change password error:", error);
    return null;
  }
};
