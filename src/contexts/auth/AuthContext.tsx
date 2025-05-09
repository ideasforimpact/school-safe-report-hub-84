
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole, ModulePermissions, AuthContextType, UserWithPassword, EmployeeType, DepartmentType } from './types';
import { useClient } from '../ClientContext';
import {
  getUserFromStorage,
  getUsersFromStorage,
  saveUserToStorage,
  saveUsersToStorage,
  loginUser,
  logoutUser,
  changeUserPassword
} from '@/services/auth/authService';
import {
  addNewUser,
  updateExistingUser,
  deleteExistingUser,
  deactivateExistingUser
} from '@/services/auth/userManagementService';

// Helper functions to exclude password from user objects
const excludePasswordFromUser = (user: UserWithPassword): User => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const excludePasswordFromUsers = (users: UserWithPassword[]): User[] => {
  return users.map(excludePasswordFromUser);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getUserFromStorage());
  const [users, setUsers] = useState<UserWithPassword[]>(() => getUsersFromStorage());

  // Get client context to validate domains
  const clientContext = useContext(React.createContext<{ isEmailDomainAllowed?: (email: string, clientId: string) => boolean }>({}));
  
  // Save users to localStorage whenever they change
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  // Debug: Log current users to help debugging
  useEffect(() => {
    console.log("Current users in AuthContext:", users);
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = loginUser(
      email, 
      password, 
      users,
      clientContext.isEmailDomainAllowed
    );
    
    if (loggedInUser) {
      // Don't allow inactive users to log in
      if (!loggedInUser.isActive) {
        return false;
      }
      
      setUser(loggedInUser);
      saveUserToStorage(loggedInUser);
      
      // Update users list if it was reset during login
      const currentUsers = getUsersFromStorage();
      if (currentUsers !== users) {
        setUsers(currentUsers);
      }
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    logoutUser();
  };

  const addUser = (userData: { 
    firstName: string;
    lastName: string;
    email: string; 
    password: string; 
    role: UserRole; 
    modulePermissions: ModulePermissions;
    clientId?: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
  }) => {
    const updatedUsers = addNewUser(users, { ...userData, isActive: true }, clientContext.isEmailDomainAllowed);
    if (updatedUsers) {
      setUsers(updatedUsers);
    }
  };

  const updateUser = (id: string, updates: Partial<User & { password?: string }>) => {
    const updatedUsers = updateExistingUser(users, id, updates);
    if (updatedUsers) {
      setUsers(updatedUsers);
      
      // If the currently logged-in user is being updated, update their session too
      if (user && user.id === id) {
        const { password, ...updatesWithoutPassword } = updates;
        const updatedUser = { ...user, ...updatesWithoutPassword };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }
    }
  };

  const deleteUser = (id: string) => {
    const updatedUsers = deleteExistingUser(users, id, user?.id);
    if (updatedUsers) {
      setUsers(updatedUsers);
    }
  };

  const deactivateUser = (id: string) => {
    const updatedUsers = deactivateExistingUser(users, id, user?.id);
    if (updatedUsers) {
      setUsers(updatedUsers);
      
      // If the currently logged-in user is being deactivated, log them out
      if (user && user.id === id) {
        logout();
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const updatedUsers = changeUserPassword(users, user.id, currentPassword, newPassword);
    if (updatedUsers) {
      setUsers(updatedUsers);
      return true;
    }

    return false;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'saas_owner';
  const isSaasOwner = user?.role === 'saas_owner';

  // Expose only user objects without passwords
  const usersWithoutPasswords = excludePasswordFromUsers(users);

  return (
    <AuthContext.Provider value={{ 
      user, 
      users: usersWithoutPasswords, 
      login, 
      logout, 
      isAdmin,
      isSaasOwner,
      addUser,
      updateUser,
      deleteUser,
      deactivateUser,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
