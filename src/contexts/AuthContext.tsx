
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from "@/components/ui/sonner";

export type UserRole = 'reporter' | 'admin';

// Define module access permissions
export interface ModulePermissions {
  incidentReporting: boolean;
  allIncidents: boolean;
  insights: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  modulePermissions: ModulePermissions;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  addUser: (userData: { name: string; email: string; password: string; role: UserRole, modulePermissions: ModulePermissions }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default module permissions
const DEFAULT_ADMIN_PERMISSIONS: ModulePermissions = {
  incidentReporting: true,
  allIncidents: true,
  insights: true
};

const DEFAULT_REPORTER_PERMISSIONS: ModulePermissions = {
  incidentReporting: true,
  allIncidents: true,
  insights: true
};

// Mock users for demo purposes
const INITIAL_MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@school.edu',
    password: 'admin123',
    role: 'admin' as UserRole,
    modulePermissions: DEFAULT_ADMIN_PERMISSIONS
  },
  {
    id: '2',
    name: 'Teacher Reporter',
    email: 'reporter@school.edu',
    password: 'reporter123',
    role: 'reporter' as UserRole,
    modulePermissions: DEFAULT_REPORTER_PERMISSIONS
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [users, setUsers] = useState<(User & { password: string })[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : INITIAL_MOCK_USERS;
  });

  // Save users to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = users.find(
      u => u.email === email && u.password === password
    );
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      toast.success(`Welcome back, ${userWithoutPassword.name}!`);
      return true;
    } else {
      toast.error("Invalid email or password");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info("You've been logged out");
  };

  const addUser = (userData: { name: string; email: string; password: string; role: UserRole; modulePermissions: ModulePermissions }) => {
    // Check if email already exists
    const emailExists = users.some(u => u.email === userData.email);
    if (emailExists) {
      toast.error("A user with this email already exists");
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      modulePermissions: userData.modulePermissions
    };

    setUsers([...users, newUser]);
    toast.success("User added successfully");
  };

  const updateUser = (id: string, updates: Partial<User & { password?: string }>) => {
    // Check if email already exists and it's not the current user
    if (updates.email) {
      const emailExists = users.some(u => u.email === updates.email && u.id !== id);
      if (emailExists) {
        toast.error("A user with this email already exists");
        return;
      }
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
    // Prevent deleting the last admin
    const admins = users.filter(u => u.role === 'admin');
    const targetUser = users.find(u => u.id === id);
    
    if (targetUser?.role === 'admin' && admins.length <= 1) {
      toast.error("Cannot delete the last admin user");
      return;
    }

    // Prevent self-deletion
    if (user?.id === id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setUsers(users.filter(u => u.id !== id));
    toast.success("User deleted successfully");
  };

  const isAdmin = user?.role === 'admin';

  // Expose only user objects without passwords
  const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);

  return (
    <AuthContext.Provider value={{ 
      user, 
      users: usersWithoutPasswords, 
      login, 
      logout, 
      isAdmin,
      addUser,
      updateUser,
      deleteUser
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
