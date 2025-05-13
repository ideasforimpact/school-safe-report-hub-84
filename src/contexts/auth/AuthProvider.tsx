
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getUserFromStorage, getUsersFromStorage, saveUsersToStorage } from '@/services/auth/authService';
import { User, UserRole, UserWithPassword, ModulePermissions, EmployeeType, DepartmentType } from './types';
import { INITIAL_MOCK_USERS } from './initialData';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSaasOwner: boolean;
  users: UserWithPassword[];
  setUsers: React.Dispatch<React.SetStateAction<UserWithPassword[]>>;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  changePassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => boolean;
  addUser: (userData: Omit<UserWithPassword, 'id'>) => User;
  getUsersForClient: (clientId?: string) => User[];
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSaasOwner: false,
  users: [],
  setUsers: () => {},
  login: () => null,
  logout: () => {},
  changePassword: () => false,
  addUser: () => ({} as User),
  getUsersForClient: () => [],
  authError: null,
  setAuthError: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getUserFromStorage());
  const [users, setUsers] = useState<UserWithPassword[]>(() => getUsersFromStorage() || INITIAL_MOCK_USERS);
  const [authError, setAuthError] = useState<string | null>(null);

  // Computed properties
  const isAdmin = Boolean(user?.role === 'admin' || user?.role === 'saas_owner');
  const isSaasOwner = Boolean(user?.role === 'saas_owner');

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      saveUsersToStorage(users);
    }
  }, [users]);

  // Mock login function
  const login = (email: string, password: string): User | null => {
    const foundUser = users.find(
      (u) => u.email === email && 
             u.password === password && 
             u.isActive !== false
    );
    
    if (!foundUser) {
      setAuthError("Invalid credentials");
      return null;
    }
    
    // Create user without password
    const { password: _, ...userWithoutPassword } = foundUser;
    
    // Set the current user
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    setAuthError(null);
    return userWithoutPassword;
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // Mock change password function
  const changePassword = (
    userId: string,
    currentPassword: string,
    newPassword: string
  ): boolean => {
    const userIndex = users.findIndex(
      (u) => u.id === userId && u.password === currentPassword
    );
    
    if (userIndex === -1) {
      setAuthError("Current password is incorrect");
      return false;
    }
    
    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPassword,
    };
    
    setUsers(updatedUsers);
    setAuthError(null);
    return true;
  };

  // Mock addUser function
  const addUser = (userData: Omit<UserWithPassword, 'id'>): User => {
    // Create new user with ID
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      isActive: true,
    };
    
    setUsers((prevUsers) => [...prevUsers, newUser]);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };

  // Function to get users for a specific client
  const getUsersForClient = (clientId?: string): User[] => {
    if (!clientId) {
      return users.map(({ password, ...user }) => user);
    }
    
    return users
      .filter((user) => user.clientId === clientId || user.role === 'saas_owner')
      .map(({ password, ...user }) => user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSaasOwner,
        users,
        setUsers,
        login,
        logout,
        changePassword,
        addUser,
        getUsersForClient,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
