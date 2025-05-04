
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { User, UserRole, ModulePermissions, AuthContextType, UserWithPassword } from './types';
import { INITIAL_MOCK_USERS } from './initialData';
import { validateUserEmail, validateAdminDeletion, excludePasswordFromUser, excludePasswordFromUsers } from './utils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [users, setUsers] = useState<UserWithPassword[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : INITIAL_MOCK_USERS;
  });

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Debug: Log current users to help debugging
  useEffect(() => {
    console.log("Current users in AuthContext:", users);
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log("Attempting login with:", email, password);
    console.log("Available users:", users.map(u => ({ email: u.email, password: u.password })));
    
    // Reset users to initial data if they got corrupted
    if (!users.length || !users.some(u => u.email === "owner@saasplatform.com")) {
      console.log("Resetting users to initial data");
      const resetUsers = INITIAL_MOCK_USERS;
      setUsers(resetUsers);
      localStorage.setItem('users', JSON.stringify(resetUsers));
      
      // Try to find the user in the reset data
      const foundUser = resetUsers.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const userWithoutPassword = excludePasswordFromUser(foundUser);
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        toast.success(`Welcome back, ${userWithoutPassword.name}!`);
        return true;
      }
    } else {
      // Normal login flow
      const foundUser = users.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const userWithoutPassword = excludePasswordFromUser(foundUser);
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        toast.success(`Welcome back, ${userWithoutPassword.name}!`);
        return true;
      }
    }
    
    toast.error("Invalid email or password");
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info("You've been logged out");
  };

  const addUser = (userData: { name: string; email: string; password: string; role: UserRole; modulePermissions: ModulePermissions, clientId?: string }) => {
    // Check if email already exists
    if (!validateUserEmail(users, userData.email)) {
      return;
    }

    const newUser: UserWithPassword = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      modulePermissions: userData.modulePermissions,
      clientId: userData.clientId
    };

    setUsers([...users, newUser]);
    toast.success("User added successfully");
  };

  const updateUser = (id: string, updates: Partial<User & { password?: string }>) => {
    // Check if email already exists and it's not the current user
    if (updates.email && !validateUserEmail(users, updates.email, id)) {
      return;
    }

    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, ...updates };
      }
      return u;
    }));

    // If the currently logged-in user is being updated, update their session too
    if (user && user.id === id) {
      const { password, ...updatesWithoutPassword } = updates;
      const updatedUser = { ...user, ...updatesWithoutPassword };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    toast.success("User updated successfully");
  };

  const deleteUser = (id: string) => {
    if (!validateAdminDeletion(users, id, user?.id)) {
      return;
    }

    setUsers(users.filter(u => u.id !== id));
    toast.success("User deleted successfully");
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    // First, verify the current password
    if (!user) {
      toast.error("You must be logged in to change your password");
      return false;
    }

    const userRecord = users.find(u => u.id === user.id);
    
    if (!userRecord || userRecord.password !== currentPassword) {
      toast.error("Current password is incorrect");
      return false;
    }

    // Update the password
    setUsers(users.map(u => {
      if (u.id === user.id) {
        return { ...u, password: newPassword };
      }
      return u;
    }));

    toast.success("Password changed successfully");
    return true;
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
