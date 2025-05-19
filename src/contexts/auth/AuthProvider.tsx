import React, { createContext, useEffect, useState, useRef } from 'react';
import { User, AuthContextType, UserWithPassword, EmployeeData } from './types';
import { 
  getUserFromStorage, 
  logoutUser, 
  loginUser, 
  setUsers, 
  getUsersFromStorage,
  saveUserToStorage, 
  saveUsersToStorage,
  getCurrentUserData,
  changeUserPassword,
  getEmployeeDataFromStorage,
  saveEmployeeDataToStorage
} from '@/services/auth/authService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthHandlers } from './hooks/useAuthHandlers';

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
  handleUserAuthentication: async () => {},
  employeeData: null, // Initialize with null
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for the current user, all users, and auth error
  const [currentUser, setCurrentUser] = useState<User | null>(getUserFromStorage());
  const [users, setUsersState] = useState<UserWithPassword[]>(getUsersFromStorage());
  const [displayUsers, setDisplayUsers] = useState<User[]>(
    users.map(({ password, ...user }) => user)
  );
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(getEmployeeDataFromStorage());
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBackofficeUser, setIsBackofficeUser] = useState<boolean>(false);
  const authInitCompleteRef = useRef<boolean>(false);
  const authListenerSetupRef = useRef<boolean>(false);

  // Import useAuthHandlers to get handleUserAuthentication function
  const { handleUserAuthentication } = useAuthHandlers({
    user: currentUser,
    users,
    setUser: setCurrentUser,
    setUsers: setUsersState,
    setAuthError,
    authInitCompleteRef,
    setEmployeeData
  });

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles
  const isAdmin = Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  const isSaasOwner = Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);

  // Setup Supabase auth listener for Google authentication
  useEffect(() => {
    // Only setup listener once
    if (authListenerSetupRef.current) return;
    
    console.log("🔵 Setting up Supabase auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("👤 User signed in event detected:", session.user.email);
        
        try {
          console.log("🔍 Processing authentication for user:", session.user.email);
          // Use setTimeout to avoid potential deadlock issues with Supabase auth
          setTimeout(async () => {
            await handleUserAuthentication(session.user);
          }, 0);
        } catch (error) {
          console.error("❌ Error in auth state change handler:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out event detected");
        setCurrentUser(null);
        setEmployeeData(null); // Clear employee data on logout
        saveEmployeeDataToStorage(null); // Clear from storage
        setAuthError(null);
      }
    });
    
    authListenerSetupRef.current = true;
    
    // Return cleanup function
    return () => {
      console.log("🧹 Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication]);

  // Fetch users from Supabase on mount
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        console.log("🔍 Checking initial Supabase auth session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("✅ Found existing session for:", data.session.user.email);
          
          // Check if we already have a user loaded from storage
          if (!currentUser) {
            console.log("👤 Processing existing session user");
            // Use setTimeout to avoid potential deadlock issues
            setTimeout(async () => {
              await handleUserAuthentication(data.session?.user);
            }, 0);
          }
        } else {
          console.log("ℹ️ No existing session found");
        }
      } catch (error) {
        console.error("❌ Error checking Supabase auth:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkSupabaseAuth();
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    
    try {
      // First try to login as a regular user
      const user = loginUser(email, password, users);

      if (user) {
        setCurrentUser(user);
        saveUserToStorage(user);
        
        // Fetch employee data after successful login
        try {
          const { data: employeeData, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name')
            .eq('email', email.toLowerCase())
            .single();
          
          if (employeeData && !error) {
            const employee: EmployeeData = {
              id: employeeData.id,
              clientId: employeeData.client_id,
              email: employeeData.email,
              firstName: employeeData.first_name,
              lastName: employeeData.last_name
            };
            
            setEmployeeData(employee);
            saveEmployeeDataToStorage(employee);
            console.log("📝 Employee data stored in context:", employee);
          } else {
            console.log("⚠️ No employee data found for user:", email);
          }
        } catch (err) {
          console.error("❌ Error fetching employee data:", err);
        }
        
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
        saveUserToStorage(saasUser);
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
  const handleLogout = (): void => {
    setCurrentUser(null);
    setEmployeeData(null); // Clear employee data on logout
    saveEmployeeDataToStorage(null); // Clear from storage
    setIsBackofficeUser(false);
    logoutUser();
    toast.info("You have been logged out");
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
    const storedUsers = getUsersFromStorage();
    const updatedUsers = changeUserPassword(storedUsers, currentUser.id, currentPassword, newPassword);

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
    handleUserAuthentication,
    employeeData, // Add employee data to context value
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
