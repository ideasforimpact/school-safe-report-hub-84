import React, { createContext, useEffect, useState, useRef } from 'react';
import { User, AuthContextType, UserWithPassword, EmployeeData, Client, ClientType } from './types';
import { 
  logoutUser, 
  loginUser, 
  setUsers, 
  getUsersFromStorage,
  saveUsersToStorage,
  getCurrentUserData,
  changeUserPassword,
  saveEmployeeDataToStorage
} from '@/services/auth/authService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import AuthLoadingOverlay from '@/components/auth/AuthLoadingOverlay';
import { useNavigate, useLocation } from 'react-router-dom';

// Create the context with async logout and isInitializing property
export const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  login: async () => false,
  logout: async () => {},
  isAdmin: false,
  isSaasOwner: false,
  isBackofficeUser: false,
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
  deactivateUser: () => {},
  reactivateUser: () => {},
  changePassword: async () => false,
  authError: null,
  handleUserAuthentication: async () => {},
  employeeData: null,
  setUser: () => {},
  isInitializing: true, // Add the missing isInitializing property
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state for authentication
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsersState] = useState<UserWithPassword[]>(getUsersFromStorage());
  const [displayUsers, setDisplayUsers] = useState<User[]>(
    users.map(({ password, ...user }) => user)
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isBackofficeUser, setIsBackofficeUser] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showAuthLoading, setShowAuthLoading] = useState<boolean>(false);
  
  // Refs to control initialization flow
  const authInitCompleteRef = useRef<boolean>(false);
  const authListenerSetupRef = useRef<boolean>(false);
  const authCheckInProgressRef = useRef<boolean>(false);
  const backofficeStateRestoredRef = useRef<boolean>(false);

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles from current user
  const isAdmin = Boolean(user?.role === 'admin' || user?.modulePermissions?.superAdmin || employeeData);
  const isSaasOwner = Boolean(user?.role === 'saas_owner' || isBackofficeUser);

  // Helper function to fetch client and client type information
  const fetchClientInfo = useRef(async (clientId: string): Promise<{ client: Client | null, clientType: ClientType | null }> => {
    try {
      // Fetch client information with client type
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          client_type:client_type_id (
            id,
            name,
            key,
            created_at,
            updated_at
          )
        `)
        .eq('id', clientId)
        .single();

      if (clientError || !clientData) {
        console.error("Error fetching client data:", clientError);
        return { client: null, clientType: null };
      }

      const client: Client = {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        contact_person: clientData.contact_person,
        phone: clientData.phone,
        allowed_domains: clientData.allowed_domains,
        super_admin_allowed_domain: clientData.super_admin_allowed_domain,
        auth_providers: clientData.auth_providers,
        creation_date: clientData.creation_date,
        active: clientData.active,
        client_type_id: clientData.client_type_id,
        institution_type: clientData.institution_type,
        logo: clientData.logo,
        client_type: clientData.client_type
      };

      const clientType: ClientType | null = clientData.client_type ? {
        id: clientData.client_type.id,
        name: clientData.client_type.name,
        key: clientData.client_type.key,
        created_at: clientData.client_type.created_at,
        updated_at: clientData.client_type.updated_at
      } : null;

      return { client, clientType };
    } catch (error) {
      console.error("Error in fetchClientInfo:", error);
      return { client: null, clientType: null };
    }
  }).current;

  // Enhanced setUser function that ensures client info is included
  const setCurrentUserWithClientInfo = useRef(async (user: User | null) => {
    if (!user) {
      setUser(null);
      return;
    }

    setShowAuthLoading(true);

    // If user already has client info, use it directly
    if (user.client !== undefined && user.clientType !== undefined) {
      setUser(user);
      setTimeout(() => setShowAuthLoading(false), 2000);
      return;
    }

    // If user has clientId but no client info, fetch it
    if (user.clientId && !user.client) {
      try {
        const { client, clientType } = await fetchClientInfo(user.clientId);
        const userWithClientInfo = {
          ...user,
          client,
          clientType
        };
        setUser(userWithClientInfo);
        setTimeout(() => setShowAuthLoading(false), 2000);
      } catch (error) {
        console.error("Error fetching client info for user:", error);
        setUser(user);
        setTimeout(() => setShowAuthLoading(false), 2000);
      }
    } else {
      setUser(user);
      setTimeout(() => setShowAuthLoading(false), 2000);
    }
  }).current;

  // Add setUser function that can be called directly with enhanced logging
  const handleSetUser = (user: User | null) => {
    console.log('🔄 AuthProvider: Setting user to:', user);
    console.log('🕐 AuthProvider: setUser called at:', new Date().toISOString());
    setUser(user);
    
    // Add a small delay to verify state propagation
    setTimeout(() => {
      console.log('✅ AuthProvider: User state after setUser:', user);
    }, 100);
  };

  // FIXED: Restore backoffice state from storage on initialization with proper state setting
  useEffect(() => {
    if (backofficeStateRestoredRef.current) return;
    
    console.log('🔄 AuthProvider: Restoring backoffice state from storage');
    
    // Try to restore backoffice user state from sessionStorage
    try {
      const savedEmployeeData = sessionStorage.getItem('employeeData');
      const savedIsBackoffice = sessionStorage.getItem('isBackofficeUser');
      
      if (savedEmployeeData && savedIsBackoffice === 'true') {
        console.log('📦 AuthProvider: Found saved backoffice state');
        const parsedEmployeeData = JSON.parse(savedEmployeeData);
        
        // Reconstruct backoffice user
        const backofficeUser: User = {
          id: parsedEmployeeData.id,
          firstName: parsedEmployeeData.firstName || 'Backoffice',
          lastName: parsedEmployeeData.lastName || 'Admin',
          email: parsedEmployeeData.email,
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
          client: null,
          clientType: null
        };
        
        console.log('✅ AuthProvider: Restoring backoffice user:', backofficeUser);
        
        // Set ALL backoffice state atomically and immediately
        setUser(backofficeUser);
        setEmployeeData(parsedEmployeeData);
        setIsBackofficeUser(true);
        
        console.log('🔧 AuthProvider: Backoffice state restored completely');
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error restoring backoffice state:', error);
    }
    
    backofficeStateRestoredRef.current = true;
  }, []);

  // Import useAuthHandlers
  const { handleUserAuthentication } = useAuthHandlers({
    user: user,
    users,
    setUser: (user: User | null) => setUser(user),
    setUsers: setUsersState,
    setAuthError: (error: string | null) => setAuthError(error),
    authInitCompleteRef,
    setEmployeeData: (employeeData: EmployeeData | null) => setEmployeeData(employeeData),
    dispatch: () => {} // No longer using dispatch
  });

  // Setup Supabase auth listener for Google authentication
  useEffect(() => {
    if (authListenerSetupRef.current) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle non-backoffice users here
      if (isBackofficeUser) {
        console.log('⏸️ AuthProvider: Skipping Supabase auth change - backoffice user active');
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setShowAuthLoading(true);
          setTimeout(async () => {
            await handleUserAuthentication(session.user);
            setTimeout(() => setShowAuthLoading(false), 2000);
          }, 0);
        } catch (error) {
          console.error("Error in handleUserAuthentication:", error);
          toast.error("Authentication failed. Please try again.");
          setShowAuthLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear state if not a backoffice user
        if (!isBackofficeUser) {
          setUser(null);
          setEmployeeData(null);
          setAuthError(null);
          setShowAuthLoading(false);
          toast.info("You have been logged out");
          logoutUser();
        }
      }
    });
    
    authListenerSetupRef.current = true;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication, isBackofficeUser]);

  // FIXED: Modified Supabase auth check that properly preserves backoffice state
  useEffect(() => {
    if (authCheckInProgressRef.current || !backofficeStateRestoredRef.current) return;

    const checkSupabaseAuth = async () => {
      if (authCheckInProgressRef.current) return;
      authCheckInProgressRef.current = true;
      
      try {
        // CRITICAL FIX: Check for backoffice user FIRST and skip entirely if found
        if (isBackofficeUser && user) {
          console.log('✅ AuthProvider: Backoffice user detected, skipping Supabase auth check entirely');
          setIsInitializing(false);
          return;
        }

        // Also check sessionStorage for backoffice state as backup
        const savedIsBackoffice = sessionStorage.getItem('isBackofficeUser');
        if (savedIsBackoffice === 'true') {
          console.log('✅ AuthProvider: Backoffice user detected in storage, skipping Supabase auth check');
          setIsInitializing(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (!user) {
            setShowAuthLoading(true);
            setTimeout(async () => {
              await handleUserAuthentication(data.session?.user);
              setTimeout(() => setShowAuthLoading(false), 2000);
            }, 0);
          }
        } else {
          // Only clear if we don't have a backoffice user and no regular user
          if (!isBackofficeUser && !user) {
            console.log('🧹 AuthProvider: No Supabase session and no backoffice user, clearing state');
            setUser(null);
            setEmployeeData(null);
            setAuthError(null);
            logoutUser();
          }
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        toast.error("Error checking authentication status");
      } finally {
        setIsInitializing(false);
        authCheckInProgressRef.current = false;
      }
    };

    checkSupabaseAuth();
  }, [user, isBackofficeUser, handleUserAuthentication, backofficeStateRestoredRef.current]);

  // Handle login with improved state management
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setShowAuthLoading(true);
    
    try {
      // First try to login as a regular user
      const regularUser = loginUser(email, password, users);

      if (regularUser) {
        console.log('✅ AuthProvider: Regular user login successful:', regularUser.email);
        await setCurrentUserWithClientInfo(regularUser);
        
        // Fetch employee data after successful login
        try {
          const { data: employeeDataResponse, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type')
            .eq('email', email.toLowerCase())
            .single();
          
          if (employeeDataResponse && !error) {
            const { client, clientType } = await fetchClientInfo(employeeDataResponse.client_id);

            const employee: EmployeeData = {
              id: employeeDataResponse.id,
              clientId: employeeDataResponse.client_id,
              email: employeeDataResponse.email,
              firstName: employeeDataResponse.first_name,
              lastName: employeeDataResponse.last_name,
              isSuperAdmin: employeeDataResponse.is_super_admin,
              department: employeeDataResponse.department, 
              employeeType: employeeDataResponse.employee_type,
              client: client,
              clientType: clientType
            };
            
            setEmployeeData(employee);
            saveEmployeeDataToStorage(employee);
          }
        } catch (err) {
          console.error("Error fetching employee data for regular user:", err);
        }
        
        setTimeout(() => setShowAuthLoading(false), 2000);
        return true;
      }

      // If regular login fails, try backoffice login
      console.log('🔄 AuthProvider: Attempting backoffice login for:', email);
      const { data, error } = await supabase.rpc('verify_password', { 
        email, 
        password_attempt: password 
      });

      if (error) {
        console.error('❌ AuthProvider: Backoffice login error:', error);
        setAuthError("Invalid credentials");
        setShowAuthLoading(false);
        return false;
      }

      if (data === true) {
        console.log('✅ AuthProvider: Backoffice login successful for:', email);
        // Fetch the backoffice user
        const { data: backofficeUser, error: backofficeError } = await supabase
          .from('backoffice_users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (backofficeError || !backofficeUser) {
          console.error('❌ AuthProvider: Error fetching backoffice user:', backofficeError);
          setAuthError("Error retrieving user data");
          setShowAuthLoading(false);
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
          createdAt: backofficeUser.created_at,
          client: null,
          clientType: null
        };
        
        // Create employee data for backoffice user
        const backofficeEmployeeData: EmployeeData = {
          id: backofficeUser.id,
          clientId: null,
          email: backofficeUser.email,
          firstName: 'Backoffice',
          lastName: 'Admin',
          isSuperAdmin: true,
          department: 'Management',
          employeeType: 'admin',
          client: null,
          clientType: null
        };
        
        // Set ALL state atomically to prevent race conditions
        console.log('🔧 AuthProvider: Setting complete backoffice state');
        setUser(saasUser);
        setIsBackofficeUser(true);
        setEmployeeData(backofficeEmployeeData);
        saveEmployeeDataToStorage(backofficeEmployeeData);
        
        // Persist backoffice state to sessionStorage
        sessionStorage.setItem('isBackofficeUser', 'true');
        sessionStorage.setItem('employeeData', JSON.stringify(backofficeEmployeeData));
        
        console.log('✅ AuthProvider: Backoffice login completed successfully');
        setTimeout(() => setShowAuthLoading(false), 2000);
        return true;
      }

      setAuthError("Invalid credentials");
      setShowAuthLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Login failed");
      toast.error("Login failed");
      setShowAuthLoading(false);
      return false;
    }
  };

  // Handle logout with proper navigation and cleanup
  const handleLogout = async (): Promise<void> => {
    console.log('🚪 AuthProvider: Starting logout process');
    
    try {
      // Clear state immediately
      console.log('🧹 AuthProvider: Clearing authentication state');
      setUser(null);
      setEmployeeData(null);
      setIsBackofficeUser(false);
      setAuthError(null);
      
      // Clear local storage
      console.log('💾 AuthProvider: Clearing local storage');
      logoutUser();
      
      // Clear backoffice-specific storage
      sessionStorage.removeItem('isBackofficeUser');
      sessionStorage.removeItem('employeeData');
      
      // For non-backoffice users, sign out from Supabase
      if (!isBackofficeUser) {
        try {
          console.log('🔐 AuthProvider: Signing out from Supabase');
          await supabase.auth.signOut();
        } catch (supabaseError) {
          console.error('Error signing out from Supabase:', supabaseError);
        }
      }
      
      // Determine where to redirect
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      const shouldRedirectToBackoffice = isCurrentlyBackoffice;
      
      // Navigate immediately after clearing state
      console.log('🧭 AuthProvider: Navigating to login page');
      if (shouldRedirectToBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      
      toast.success('You have been logged out successfully');
      
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('There was an error logging out');
      
      // Fallback navigation in case of error
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      if (isCurrentlyBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
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
    if (!user) {
      toast.error("No user logged in");
      return false;
    }

    const updatedUsers = changeUserPassword(users, user.id, currentPassword, newPassword);
    
    if (updatedUsers) {
      setUsersState(updatedUsers);
      toast.success("Password changed successfully");
      return true;
    } else {
      toast.error("Current password is incorrect");
      return false;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user: user,
    users: displayUsers,
    login: handleLogin,
    logout: handleLogout,
    isAdmin,
    isSaasOwner,
    isBackofficeUser,
    addUser: handleAddUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    deactivateUser: handleDeactivateUser,
    reactivateUser: handleReactivateUser,
    changePassword: handleChangePassword,
    authError,
    handleUserAuthentication,
    employeeData: employeeData,
    setUser: handleSetUser,
    isInitializing: isInitializing, // Add this line
  };

  if (isInitializing) {
    return <AuthLoadingOverlay isVisible={true} />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {showAuthLoading && <AuthLoadingOverlay isVisible={showAuthLoading} />}
      {children}
    </AuthContext.Provider>
  );
};
