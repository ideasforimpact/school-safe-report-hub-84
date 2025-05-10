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
import { supabase } from '@/integrations/supabase/client';

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

  // Set up Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Find or create user in our local system
        const supabaseUser = session.user;
        
        // Check if user exists in our system
        let existingUser = users.find(u => u.email === supabaseUser.email);
        
        if (existingUser) {
          // Update login timestamp
          const updatedUser = {
            ...existingUser,
            lastLogin: new Date().toISOString()
          };
          
          const updatedUsers = users.map(u => 
            u.id === existingUser?.id ? { ...u, lastLogin: new Date().toISOString() } : u
          );
          
          setUsers(updatedUsers);
          setUser(excludePasswordFromUser(updatedUser));
          saveUserToStorage(excludePasswordFromUser(updatedUser));
        } else {
          // For new users via SSO, create a basic account (can be enhanced later)
          const newUser: UserWithPassword = {
            id: supabaseUser.id,
            firstName: supabaseUser.user_metadata.full_name?.split(' ')[0] || 'New',
            lastName: supabaseUser.user_metadata.full_name?.split(' ').slice(1).join(' ') || 'User',
            email: supabaseUser.email || '',
            password: '', // SSO users don't need passwords in our system
            role: 'reporter', // Default role
            modulePermissions: {
              superAdmin: false,
              incidentReporting: true,
              incidentAdmin: false,
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: false,
              eduSafeResourceAccess: false
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(excludePasswordFromUser(newUser));
          saveUserToStorage(excludePasswordFromUser(newUser));
        }
      } else if (event === 'SIGNED_OUT') {
        // Handle sign out if needed
        // Note: we're keeping our own logout flow separate
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
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
      
      // Also sign in with Supabase
      try {
        await supabase.auth.signInWithPassword({
          email,
          password
        });
      } catch (error) {
        console.error("Supabase auth error (non-critical):", error);
      }
      
      setUser(loggedInUser);
      saveUserToStorage(loggedInUser);
      
      return true;
    }
    
    console.log("Login failed");
    return false;
  };

  const logout = async () => {
    setUser(null);
    logoutUser();
    
    // Also sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signout error:", error);
    }
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
