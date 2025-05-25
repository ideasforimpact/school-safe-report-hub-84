
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setClientId, setConfiguredModules, resetEmployee, setLoading } from '@/store/employeeActions';

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
  employeeData: null,
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
  
  // Access EmployeeStore - available since we are now properly wrapped with EmployeeProvider
  const { dispatch } = useEmployeeStore();

  // Import useAuthHandlers to get handleUserAuthentication function
  const { handleUserAuthentication } = useAuthHandlers({
    user: currentUser,
    users,
    setUser: setCurrentUser,
    setUsers: setUsersState,
    setAuthError,
    authInitCompleteRef,
    setEmployeeData,
    dispatch // Pass Redux dispatch to useAuthHandlers
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Use setTimeout to avoid potential deadlock issues with Supabase auth
          setTimeout(async () => {
            await handleUserAuthentication(session.user);
          }, 0);
        } catch (error) {
          toast.error("Authentication failed. Please try again.");
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setEmployeeData(null); // Clear employee data on logout
        saveEmployeeDataToStorage(null); // Clear from storage
        setAuthError(null);
        
        // Clear Redux state on logout - FIXED: Properly dispatch action
        dispatch(resetEmployee());
        
        // Add a toast message for logout
        toast.info("You have been logged out");
        
        // Clear any local auth data
        logoutUser();
      }
    });
    
    authListenerSetupRef.current = true;
    
    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication, dispatch]);

  // Fetch users from Supabase on mount
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Check if we already have a user loaded from storage
          if (!currentUser) {
            // Use setTimeout to avoid potential deadlock issues
            setTimeout(async () => {
              await handleUserAuthentication(data.session?.user);
            }, 0);
          }
        } else {
          // If we have a user in storage but no active session, clear it
          if (currentUser) {
            setCurrentUser(null);
            setEmployeeData(null);
            saveEmployeeDataToStorage(null);
            
            // Clear Redux state - FIXED: Properly dispatch action
            dispatch(resetEmployee());
            
            logoutUser();
            toast.info("Your session has expired. Please log in again.");
          }
        }
      } catch (error) {
        toast.error("Error checking authentication status");
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
          dispatch(setLoading(true));
          
          const { data: employeeData, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type')
            .eq('email', email.toLowerCase())
            .single();
          
          if (employeeData && !error) {
            const employee: EmployeeData = {
              id: employeeData.id,
              clientId: employeeData.client_id,
              email: employeeData.email,
              firstName: employeeData.first_name,
              lastName: employeeData.last_name,
              isSuperAdmin: employeeData.is_super_admin,
              department: employeeData.department, 
              employeeType: employeeData.employee_type
            };
            
            // Update local state
            setEmployeeData(employee);
            saveEmployeeDataToStorage(employee);
            
            // Update Redux state using action creators properly - FIXED: Dispatch the action object
            dispatch(setEmployeeData(employee));
            
            if (employee.clientId) {
              dispatch(setClientId(employee.clientId));
            }
          }
          
          dispatch(setLoading(false));
        } catch (err) {
          dispatch(setLoading(false));
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
        
        // Update local state
        setCurrentUser(saasUser);
        setIsBackofficeUser(true);
        saveUserToStorage(saasUser);
        
        // Create employee data for backoffice user
        const backofficeEmployeeData: EmployeeData = {
          id: backofficeUser.id,
          clientId: null,
          email: backofficeUser.email,
          firstName: 'Backoffice',
          lastName: 'Admin',
          isSuperAdmin: true,
          department: 'Management',
          employeeType: 'admin'
        };
        
        // Update local state
        setEmployeeData(backofficeEmployeeData);
        saveEmployeeDataToStorage(backofficeEmployeeData);
        
        // Update Redux state - FIXED: Dispatch the action objects properly
        dispatch(setEmployeeData(backofficeEmployeeData));
        
        if (backofficeEmployeeData.clientId) {
          dispatch(setClientId(backofficeEmployeeData.clientId));
        }
        
        // Set modules for backoffice user (all modules enabled)
        const backofficeModules = [
          {
            id: 'dashboard-admin',
            name: 'Dashboard',
            key: 'dashboard',
            icon: 'LayoutDashboard',
            level: 'admin',
            enabled: true,
            accessLevel: {}
          },
          {
            id: 'admin-settings',
            name: 'Settings',
            key: 'adminSettings',
            icon: 'Settings',
            level: 'admin',
            enabled: true,
            accessLevel: {}
          }
        ];
        
        // Update Redux state with modules using action creators properly - FIXED
        dispatch(setConfiguredModules(backofficeModules));
        
        toast.success(`Welcome back, Backoffice Admin!`);
        return true;
      }

      setAuthError("Invalid credentials");
      return false;
    } catch (error) {
      setAuthError("Login failed");
      toast.error("Login failed");
      return false;
    }
  };

  // Handle logout - Updated to redirect directly to login page
  const handleLogout = (): void => {
    // First clear all local state and Redux store before any Supabase operations
    setCurrentUser(null);
    setEmployeeData(null);
    saveEmployeeDataToStorage(null);
    setIsBackofficeUser(false);
    
    // Clear Redux state - FIXED: Properly dispatch action
    dispatch(resetEmployee());
    
    // Clear local storage
    logoutUser();
    toast.info("You have been logged out");
    
    // Redirect to login page immediately
    window.location.href = '/login';
    
    // Then proceed with Supabase logout (won't affect the redirection)
    supabase.auth.signOut().catch((error) => {
      console.error("Error signing out from Supabase:", error);
    });
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
    employeeData,
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
