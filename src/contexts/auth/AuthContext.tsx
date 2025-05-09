
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
    console.log("Login attempt:", email, password);
    
    const loggedInUser = loginUser(
      email, 
      password, 
      users,
      isEmailDomainAllowed
    );
    
    if (loggedInUser) {
      console.log("Login successful, user:", loggedInUser);
      
      setUser(loggedInUser);
      saveUserToStorage(loggedInUser);
      
      return true;
    }
    
    console.log("Login failed");
    return false;
  };

  const logout = () => {
    setUser(null);
    logoutUser();
  };

  const addUser = async (userData: { 
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
    try {
      // Fixed Promise handling
      const updatedUsers = await addNewUser(
        users, 
        { ...userData, isActive: true }, 
        isEmailDomainAllowed
      );
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const updateUser = async (id: string, updates: Partial<User & { password?: string }>) => {
    try {
      // Fixed Promise handling
      const updatedUsers = await updateExistingUser(users, id, updates);
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
    } catch (error) {
      console.error("Error updating user:", error);
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

  const reactivateUser = (id: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        return { ...u, isActive: true };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
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
      reactivateUser,
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
