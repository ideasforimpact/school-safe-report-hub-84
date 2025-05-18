
import { User, UserWithPassword } from '@/contexts/auth/types';
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

// In-memory user storage
let users: UserWithPassword[] = [...INITIAL_MOCK_USERS];

// User management functions
export const getUsersFromStorage = (): UserWithPassword[] => {
  return [...INITIAL_MOCK_USERS];
};

export const saveUsersToStorage = (updatedUsers: UserWithPassword[]): void => {
  users = updatedUsers;
};

// Authentication functions
export const loginUser = (
  email: string, 
  password: string,
  currentUsers: UserWithPassword[] = users,
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): User | null => {
  console.log("Attempting login with:", email, password);
  console.log("Available users:", currentUsers);
  
  // Find user with matching email and password
  const user = currentUsers.find(
    (u) => u.email === email && u.password === password && u.isActive !== false
  );
  
  if (!user) {
    console.error("Login failed - user not found or inactive");
    return null;
  }
  
  console.log("Login successful for user:", user);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const logoutUser = async (): Promise<void> => {
  console.log("LOGOUT: Clearing all user session data");
  
  try {
    // Sign out from Supabase first
    await supabase.auth.signOut();
    console.log("LOGOUT: Supabase auth signOut completed");
  } catch (error) {
    console.error("LOGOUT ERROR: Supabase signout failed", error);
  }
  
  // Clear any Supabase auth tokens that might be stored in localStorage
  const authItemsToRemove = [
    'supabase.auth.token',
    'sb-ybvxkiubnnixntghojyy-auth-token',
    'supabase.auth.refreshToken',
    'supabase.auth.expiresAt',
    'currentUser'
  ];
  
  authItemsToRemove.forEach(item => {
    if (localStorage.getItem(item)) {
      console.log(`LOGOUT: Removing ${item} from localStorage`);
      localStorage.removeItem(item);
    }
  });
  
  // As a last resort, clear the session storage too
  try {
    sessionStorage.clear();
    console.log("LOGOUT: Cleared session storage");
  } catch (error) {
    console.error("LOGOUT ERROR: Failed to clear session storage", error);
  }
  
  console.log("LOGOUT: All user session data cleared");
};

export const changeUserPassword = (
  currentUsers: UserWithPassword[],
  userId: string,
  currentPassword: string,
  newPassword: string
): UserWithPassword[] | null => {
  const userIndex = currentUsers.findIndex(
    (u) => u.id === userId && u.password === currentPassword
  );
  
  if (userIndex === -1) {
    toast.error("Current password is incorrect");
    return null;
  }
  
  const updatedUsers = [...currentUsers];
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    password: newPassword
  };
  
  toast.success("Password updated successfully");
  return updatedUsers;
};

export const registerUser = (userData: Omit<UserWithPassword, 'id'>): User => {
  // Create new user with ID
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    isActive: true
  };
  
  users = [...users, newUser];
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const getUsersForClient = (clientId?: string): User[] => {
  if (!clientId) {
    return users.map(({ password, ...user }) => user);
  }
  
  return users
    .filter(user => user.clientId === clientId || user.role === 'saas_owner')
    .map(({ password, ...user }) => user);
};

export const getCurrentUserData = (userId: string): User | undefined => {
  const user = users.find(u => u.id === userId);
  if (!user) return undefined;
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getAllUsers = (): User[] => {
  // Return all users without passwords
  return users.map(({ password, ...user }) => user);
};

// Helper to get in-memory users (for testing/debugging)
export const getUsers = (): UserWithPassword[] => [...users];

// Helper to set in-memory users (for testing/debugging)
export const setUsers = (newUsers: UserWithPassword[]): void => {
  users = [...newUsers];
};
