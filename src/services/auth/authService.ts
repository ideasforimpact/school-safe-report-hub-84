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

// Login user function
export const loginUser = (email: string, password: string, users: UserWithPassword[], isEmailDomainAllowed?: (email: string, clientId: string) => boolean): User | null => {
  const user = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password &&
    u.isActive
  );
  
  if (!user) return null;
  return excludePasswordFromUser(user);
};

// Logout user function
export const logoutUser = (): void => {
  saveUserToStorage(null);
};

// Set users
export const setUsers = (users: UserWithPassword[]): void => {
  saveUsersToStorage(users);
};

// Get current user data
export const getCurrentUserData = (userId: string, users: UserWithPassword[]): UserWithPassword | null => {
  return users.find(u => u.id === userId) || null;
};

// Change user password
export const changeUserPassword = (users: UserWithPassword[], userId: string, currentPassword: string, newPassword: string): UserWithPassword[] | null => {
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return null;
  
  const user = users[userIndex];
  
  if (user.password !== currentPassword) {
    return null;
  }
  
  const updatedUsers = [...users];
  updatedUsers[userIndex] = { ...user, password: newPassword };
  
  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};

// Employee data storage functions
export interface EmployeeData {
  id: string;
  clientId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const getEmployeeDataFromStorage = (): EmployeeData | null => {
  if (typeof localStorage === 'undefined') return null;
  const savedData = localStorage.getItem('auth.employeeData');
  if (!savedData) return null;
  
  try {
    return JSON.parse(savedData);
  } catch (error) {
    console.error('Error parsing employee data from storage:', error);
    return null;
  }
};

export const saveEmployeeDataToStorage = (data: EmployeeData | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (data) {
    localStorage.setItem('auth.employeeData', JSON.stringify(data));
  } else {
    localStorage.removeItem('auth.employeeData');
  }
};
