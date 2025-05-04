
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole, ModulePermissions, AuthContextType, UserWithPassword } from './types';
import { excludePasswordFromUser, excludePasswordFromUsers } from './utils';
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
  deleteExistingUser
} from '@/services/auth/userManagementService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getUserFromStorage());
  const [users, setUsers] = useState<UserWithPassword[]>(() => getUsersFromStorage());

  // Get client context
  const { isEmailDomainAllowed } = useClient();
  
  // Save users to localStorage whenever they change
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  // Debug: Log current users to help debugging
  useEffect(() => {
    console.log("Current users in AuthContext:", users);
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await loginUser(
      email, 
      password, 
      users,
      isEmailDomainAllowed
    );
    
    if (loggedInUser) {
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
    name: string; 
    email: string; 
    password: string; 
    role: UserRole; 
    modulePermissions: ModulePermissions;
    clientId?: string;
    designation?: string;
  }) => {
    const updatedUsers = addNewUser(users, userData, isEmailDomainAllowed);
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
