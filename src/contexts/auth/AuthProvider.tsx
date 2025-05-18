
import React, { createContext, useEffect, useState, useRef } from 'react';
import { User, AuthContextType, UserWithPassword } from './types';
import { 
  logoutUser, 
  loginUser, 
  setUsers, 
  getUsersFromStorage,
  saveUsersToStorage,
  getCurrentUserData,
  changeUserPassword
} from '@/services/auth/authService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  login: async () => false,
  logout: () => {},
  isAdmin: false,
  isSaasOwner: false,
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
  deactivateUser: () => {},
  reactivateUser: () => {},
  changePassword: async () => false,
  authError: null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for the current user, all users, and auth error
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsersState] = useState<UserWithPassword[]>(getUsersFromStorage());
  const [displayUsers, setDisplayUsers] = useState<User[]>(
    users.map(({ password, ...user }) => user)
  );
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBackofficeUser, setIsBackofficeUser] = useState<boolean>(false);
  const authInitCompleteRef = useRef<boolean>(false);
  const initialCheckPerformedRef = useRef<boolean>(false);

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles
  const isAdmin = Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  const isSaasOwner = Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);

  // Check session state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialCheckPerformedRef.current) return;
      
      console.log("AUTH PROVIDER: Initializing auth state");
      initialCheckPerformedRef.current = true;
      
      try {
        // Check Supabase auth state
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log("AUTH PROVIDER: Found active Supabase session:", data.session.user?.email);
        } else {
          console.log("AUTH PROVIDER: No active Supabase session found");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("AUTH PROVIDER: Error checking auth state:", error);
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AUTH PROVIDER: Auth state change event:", event);
        if (event === 'SIGNED_OUT') {
          console.log("AUTH PROVIDER: User signed out, clearing session data");
          setCurrentUser(null);
          setIsBackofficeUser(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    console.log("AUTH PROVIDER: Login attempt for", email);
    
    try {
      // First try to login as a regular user
      const user = loginUser(email, password, users);

      if (user) {
        setCurrentUser(user);
        toast.success(`Welcome back, ${user.firstName}!`);
        return true;
      }

      // If regular login fails, try backoffice login
      const { data, error } = await supabase.rpc('verify_password', { 
        email, 
        password_attempt: password 
      });

      if (error) {
        console.error("Login error:", error);
        setAuthError("Invalid credentials");
        return false;
      }

      if (data === true) {
        // Fetch the backoffice user
        const { data: backofficeUser, error: backofficeError } = await supabase
          .from('backoffice_users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (backofficeError || !backofficeUser) {
          console.error("Error fetching backoffice user:", backofficeError);
          setAuthError("Error retrieving user data");
          return false;
        }
        
        // Update last_signed_in
        await supabase
          .from('backoffice_users')
          .update({ last_signed_in: new Date().toISOString() })
          .eq('id', backofficeUser.id);
        
        // Create a user object for the backoffice user
        const saasUser: User = {
          id: backofficeUser.id,
          firstName: 'Backoffice',
          lastName: 'Admin',
          email: backofficeUser.email,
          role: 'saas_owner',
          isActive: true,
          modulePermissions: {
            superAdmin: true,
            incidentReporting: true,
            incidentAdmin: true,
            assessmentUser: true,
            assessmentsAdmin: true,
            employeeVerificationAdmin: true,
            grievancesAdmin: true,
            transportSafetyAdmin: true,
            eduSafeResourceAccess: true
          },
          createdAt: backofficeUser.created_at
        };
        
        setCurrentUser(saasUser);
        setIsBackofficeUser(true);
        toast.success(`Welcome back, Backoffice Admin!`);
        return true;
      }
      
      setAuthError("Invalid credentials");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Login failed");
      toast.error("Login failed");
      return false;
    }
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    console.log("AUTH PROVIDER: Logout called - clearing all session data");
    
    try {
      // First clear local state
      setCurrentUser(null);
      setIsBackofficeUser(false);
      setAuthError(null);
      
      // Then call the service to clear storage and Supabase session
      await logoutUser();
      
      console.log("AUTH PROVIDER: Logout completed successfully");
      toast.info("You have been logged out");
    } catch (error) {
      console.error("AUTH PROVIDER: Error during logout:", error);
      // Still ensure the local session is cleared
      setCurrentUser(null);
      setIsBackofficeUser(false);
    }
  };

  // Add new user
  const handleAddUser = (userData: any): void => {
    const newUser: UserWithPassword = { 
      ...userData,
      id: Date.now().toString(), 
      isActive: true,
      password: userData.password || '' 
    };
    
    setUsersState(prevUsers => {
      const updatedUsers = [...prevUsers, newUser];
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    
    toast.success("User added successfully");
  };

  // Update user
  const handleUpdateUser = (id: string, updates: Partial<User & { password?: string }>): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === id) {
          return { ...user, ...updates };
        }
        return user;
      });
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User updated successfully");
  };

  // Delete user
  const handleDeleteUser = (id: string): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.filter(user => user.id !== id);
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User deleted successfully");
  };

  // Deactivate user
  const handleDeactivateUser = (id: string): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === id) {
          return { ...user, isActive: false };
        }
        return user;
      });
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User deactivated successfully");
  };

  // Reactivate user
  const handleReactivateUser = (id: string): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === id) {
          return { ...user, isActive: true };
        }
        return user;
      });
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User reactivated successfully");
  };

  // Change password
  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error("Not authenticated");
      return false;
    }
    
    // If it's a backoffice user, use Supabase function to change password
    if (isBackofficeUser) {
      // First verify current password
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
        email: currentUser.email,
        password_attempt: currentPassword
      });
      
      if (verifyError || !isValid) {
        toast.error("Current password is incorrect");
        return false;
      }
      
      // Hash the new password
      const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
        password: newPassword
      });
      
      if (hashError) {
        toast.error("Error updating password");
        return false;
      }
      
      // Update the password
      const { error: updateError } = await supabase
        .from('backoffice_users')
        .update({ password: hashedPassword })
        .eq('id', currentUser.id);
      
      if (updateError) {
        toast.error("Error updating password");
        return false;
      }
      
      toast.success("Password updated successfully");
      return true;
    }
    
    // Regular user password change
    const updatedUsers = changeUserPassword(users, currentUser.id, currentPassword, newPassword);

    if (!updatedUsers) {
      return false;
    }

    setUsersState(updatedUsers);
    saveUsersToStorage(updatedUsers);
    return true;
  };

  // The value to be provided to the context consumers
  const value: AuthContextType = {
    user: currentUser,
    users: displayUsers,
    login: handleLogin,
    logout: handleLogout,
    isAdmin,
    isSaasOwner,
    addUser: handleAddUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser, 
    deactivateUser: handleDeactivateUser,
    reactivateUser: handleReactivateUser,
    changePassword: handleChangePassword,
    authError,
  };

  // If still initializing, show nothing
  if (isInitializing) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
