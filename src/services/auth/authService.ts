
import { User, UserWithPassword, EmployeeData } from '@/contexts/auth/types';

const USER_STORAGE_KEY = 'school-safe-user';
const USERS_STORAGE_KEY = 'school-safe-users';
const EMPLOYEE_DATA_STORAGE_KEY = 'school-safe-employee-data';

// Get current user from storage
export const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
};

// Save user to storage
export const saveUserToStorage = (user: User | null): void => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

// Get all users from storage
export const getUsersFromStorage = (): UserWithPassword[] => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
};

// Save users to storage
export const saveUsersToStorage = (users: UserWithPassword[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Save employee data to storage
export const saveEmployeeDataToStorage = (data: EmployeeData | null): void => {
  if (data) {
    console.log("Saving employee data to storage:", data);
    localStorage.setItem(EMPLOYEE_DATA_STORAGE_KEY, JSON.stringify(data));
  } else {
    console.log("Removing employee data from storage");
    localStorage.removeItem(EMPLOYEE_DATA_STORAGE_KEY);
  }
};

// Get employee data from storage
export const getEmployeeDataFromStorage = (): EmployeeData | null => {
  const storedData = localStorage.getItem(EMPLOYEE_DATA_STORAGE_KEY);
  if (storedData) {
    try {
      const data = JSON.parse(storedData);
      console.log("Retrieved employee data from storage:", data);
      return data;
    } catch (e) {
      console.error("Error parsing employee data from storage:", e);
      return null;
    }
  }
  console.log("No employee data found in storage");
  return null;
};

// Log current user out
export const logoutUser = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(EMPLOYEE_DATA_STORAGE_KEY);
};

// Log in a user with email and password
export const loginUser = (
  email: string, 
  password: string, 
  users: UserWithPassword[],
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): User | null => {
  const user = users.find(
    (u) => u.email === email && u.password === password && u.isActive
  );

  if (!user) {
    return null;
  }

  // Check domain restriction if function is provided
  if (isEmailDomainAllowed && user.clientId) {
    const isAllowed = isEmailDomainAllowed(email, user.clientId);
    if (!isAllowed) {
      console.log(`Login denied: Domain not allowed for ${email}`);
      return null;
    }
  }

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    lastLogin: new Date().toISOString(),
  };
};

// Initialize users if none exist
export const initializeUsers = (): UserWithPassword[] => {
  const defaultUsers: UserWithPassword[] = [
    {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@school.edu',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'Test',
      lastName: 'Reporter',
      email: 'reporter@school.edu',
      password: 'reporter123',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  saveUsersToStorage(defaultUsers);
  return defaultUsers;
};

// Set users
export const setUsers = (users: UserWithPassword[]): void => {
  saveUsersToStorage(users);
};

// Get the current user's data
export const getCurrentUserData = (): User | null => {
  return getUserFromStorage();
};

// Change user password
export const changeUserPassword = (
  users: UserWithPassword[],
  userId: string,
  currentPassword: string,
  newPassword: string
): UserWithPassword[] | null => {
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  const user = users[userIndex];
  
  if (user.password !== currentPassword) {
    return null;
  }
  
  const updatedUsers = [...users];
  updatedUsers[userIndex] = {
    ...user,
    password: newPassword
  };
  
  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};
