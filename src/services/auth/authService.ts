
import { User, UserWithPassword } from '@/contexts/auth/types';
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';
import { toast } from "@/components/ui/sonner";

// In-memory user storage
let users: UserWithPassword[] = [...INITIAL_MOCK_USERS];

// Authentication functions
export const loginUser = (email: string, password: string): User | null => {
  const user = users.find(
    (u) => u.email === email && u.password === password && u.isActive
  );
  
  if (!user) {
    toast.error("Invalid credentials or account is inactive");
    return null;
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
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

export const updateUserPassword = (
  userId: string,
  currentPassword: string,
  newPassword: string
): boolean => {
  const userIndex = users.findIndex(
    (u) => u.id === userId && u.password === currentPassword
  );
  
  if (userIndex === -1) {
    toast.error("Current password is incorrect");
    return false;
  }
  
  users[userIndex] = {
    ...users[userIndex],
    password: newPassword
  };
  
  toast.success("Password updated successfully");
  return true;
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
