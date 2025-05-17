
import { User, UserWithPassword } from '@/contexts/auth/types';
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

// In-memory user storage
let users: UserWithPassword[] = [...INITIAL_MOCK_USERS];

// Storage helper functions
export const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
};

export const getUsersFromStorage = (): UserWithPassword[] => {
  const storedUsers = localStorage.getItem('users');
  if (!storedUsers) return [...INITIAL_MOCK_USERS];
  try {
    return JSON.parse(storedUsers);
  } catch (error) {
    return [...INITIAL_MOCK_USERS];
  }
};

export const saveUserToStorage = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const saveUsersToStorage = (users: UserWithPassword[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
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

export const logoutUser = (): void => {
  localStorage.removeItem('currentUser');
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
