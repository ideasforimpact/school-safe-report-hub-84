
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const authInitCompleteRef = useRef(false);
  
  // Get client context to validate domains
  const { isEmailDomainAllowed } = useClient();
  
  // Use navigate for redirection
  const navigate = useNavigate();
  
  // Save users to localStorage whenever they change
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  // Set up Supabase auth listener
  useEffect(() => {
    console.log("Setting up Supabase auth listener");
    
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Don't call handleUserAuthentication directly in the event handler to avoid potential deadlocks
        setTimeout(() => {
          handleUserAuthentication(session.user);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        logoutUser();
        setAuthError(null);
      }
    });
    
    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Initial session check:", session?.user?.email);
      if (error) {
        console.error("Session check error:", error);
      }
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks
        setTimeout(() => {
          handleUserAuthentication(session.user);
        }, 0);
      } else {
        // Mark auth as initialized and complete even if no session
        setIsAuthInitialized(true);
        authInitCompleteRef.current = true;
      }
    });
    
    return () => {
      console.log("Cleaning up Supabase auth listener");
      subscription.unsubscribe();
    };
  }, [users, navigate]);
  
  const checkEmployeeAccess = async (email: string): Promise<boolean> => {
    try {
      console.log("Checking access for:", email);
      
      // Updated employee query to be more permissive - just check if email exists
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error("Employee access check error:", error);
        setAuthError(`Access denied: Employee not found with email ${email}`);
        return false;
      }
      
      if (!data) {
        console.error("No employee found with email:", email);
        setAuthError("Access denied: No employee record found");
        return false;
      }
      
      // Check if employee is in admin department and active
      if (data.department !== 'admin' || data.status !== 'active') {
        console.error("Employee not in admin department or not active:", data);
        setAuthError("Access denied: Only active admin department employees can login");
        return false;
      }
      
      console.log("Active admin employee found:", data);
      return true;
    } catch (error) {
      console.error("Error checking employee access:", error);
      setAuthError("Error verifying employee access");
      return false;
    }
  };
  
  const handleUserAuthentication = async (supabaseUser: any) => {
    // Check if user exists in our system
    console.log("Handling authentication for:", supabaseUser.email);
    
    // Check if the user has admin access in employees table
    const hasAccess = await checkEmployeeAccess(supabaseUser.email);
    if (!hasAccess) {
      console.log("Access denied: User is not an admin employee");
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }
    
    let existingUser = users.find(u => u.email === supabaseUser.email);
    let isNewUser = false;
    
    if (existingUser) {
      console.log("User found in our system:", existingUser.firstName);
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
      console.log("User session updated");
    } else {
      console.log("New user via SSO, creating account");
      // For new users via SSO, create a basic account
      const firstName = supabaseUser.user_metadata?.name?.split(' ')?.[0] || 
                        supabaseUser.user_metadata?.full_name?.split(' ')?.[0] || 
                        'New';
      const lastName = supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                      supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                      'User';
      
      console.log("Creating with name:", firstName, lastName);
      isNewUser = true;
                      
      const newUser: UserWithPassword = {
        id: supabaseUser.id,
        firstName,
        lastName,
        email: supabaseUser.email || '',
        password: '', // SSO users don't need passwords in our system
        role: 'admin', // Assign admin role since they've passed the employee check
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
      console.log("New user account created");
    }
    
    // If login was successful and we got here, clear any auth errors
    setAuthError(null);
    
    // Only show welcome toast if the authentication initialization hasn't completed yet
    // Using a ref to guarantee we only show the toast once per session
    if (!authInitCompleteRef.current) {
      if (isNewUser) {
        toast.success(`Welcome, ${existingUser?.firstName || supabaseUser.user_metadata?.name?.split(' ')?.[0] || 'New User'}!`);
      } else {
        toast.success(`Welcome back, ${existingUser?.firstName || supabaseUser.user_metadata?.name?.split(' ')?.[0] || 'User'}!`);
      }
      
      // Mark auth as initialized and complete to prevent duplicate toasts
      setIsAuthInitialized(true);
      authInitCompleteRef.current = true;
    }
    
    // Redirect to dashboard on successful login
    navigate('/dashboard');
  };

  // Debug: Log current users to help debugging
  useEffect(() => {
    console.log("Current users in AuthContext:", users);
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Login attempt:", email, password);
    
    try {
      // Check if the user is in the employees table with admin department
      const hasAccess = await checkEmployeeAccess(email);
      if (!hasAccess) {
        console.log("Access denied: User is not an admin employee");
        setAuthError("Access denied: Only admin department employees can login");
        return false;
      }
      
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
        setAuthError(null);
        
        // Toast is now handled by the auth state change listener
        
        return true;
      }
      
      console.log("Login failed");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    logoutUser();
    setAuthError(null);
    
    // Also sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signout error:", error);
    }
    
    // Redirect to login page
    navigate('/login');
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
      changePassword,
      authError
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
