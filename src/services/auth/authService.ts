
import { User, UserWithPassword } from '@/contexts/auth/types';
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';

// Get user from local storage
export const getUserFromStorage = (): User | null => {
  if (typeof localStorage === 'undefined') return null;
  const savedUser = localStorage.getItem('auth.user');
  if (!savedUser) return null;
  
  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    return null;
  }
};

// Save user to local storage
export const saveUserToStorage = (user: User | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (user) {
    localStorage.setItem('auth.user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth.user');
  }
};

// Get users from local storage or use mock data
export const getUsersFromStorage = (): UserWithPassword[] => {
  if (typeof localStorage === 'undefined') return INITIAL_MOCK_USERS;
  
  const savedUsers = localStorage.getItem('auth.users');
  if (!savedUsers) return INITIAL_MOCK_USERS;
  
  try {
    return JSON.parse(savedUsers);
  } catch (error) {
    console.error('Error parsing users from storage:', error);
    return INITIAL_MOCK_USERS;
  }
};

// Save users to local storage
export const saveUsersToStorage = (users: UserWithPassword[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('auth.users', JSON.stringify(users));
};

// Remove the password from user
export const excludePasswordFromUser = (userWithPassword: UserWithPassword): User => {
  const { password, ...userWithoutPassword } = userWithPassword;
  return userWithoutPassword;
};
