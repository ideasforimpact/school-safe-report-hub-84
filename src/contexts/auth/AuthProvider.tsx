import React, { createContext, useEffect, useState, useRef, useMemo } from 'react';
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setClientId, setConfiguredModules, resetEmployee, setLoading, setLogoutState } from '@/store/employeeActions';
import { setCurrentUser, setBackofficeUser, setAuthStatus, setAuthError, clearAuth } from '@/store/authActions';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser, getAuthError } from '@/store/authSelectors';
import { clearPersistedAuthState } from '@/store/authPersistence';
import { validateSession } from '@/utils/sessionValidation';
import AuthLoadingOverlay from '@/components/auth/AuthLoadingOverlay';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { authCoordinator } from '@/utils/authCoordinator';

// Create the context with async logout
export const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  login: async () => false,
  logout: async () => {}, // Fix: Make this async to match the type
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
  setUser: () => {},
  isProcessingAuth: false
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get Redux state and dispatch
  const { state, dispatch } = useEmployeeStore();
  
  // Get authentication state from Redux
  const currentUser = getCurrentUser(state);
  const isAuthenticated = getIsAuthenticated(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const authError = getAuthError(state);
  
  // Local state for users management and initialization
  const [users, setUsersState] = useState<UserWithPassword[]>(getUsersFromStorage());
  const [displayUsers, setDisplayUsers] = useState<User[]>(
    users.map(({ password, ...user }) => user)
  );
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showAuthLoading, setShowAuthLoading] = useState<boolean>(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  const authInitCompleteRef = useRef<boolean>(false);
  const authListenerSetupRef = useRef<boolean>(false);
  const authCheckInProgressRef = useRef<boolean>(false);
  const initializationCompleteRef = useRef<boolean>(false);
  
  // Use session refresh hook for automatic session validation
  const { refreshSession } = useSessionRefresh(5); // Check every 5 minutes

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles from Redux state
  const isAdmin = Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  const isSaasOwner = Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);

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

  // Enhanced setCurrentUser function that ensures client info is included
  const setCurrentUserWithClientInfo = useRef(async (user: User | null) => {
    if (!user) {
      dispatch(setCurrentUser(null));
      return;
    }

    setShowAuthLoading(true);

    // If user already has client info, use it directly
    if (user.client !== undefined && user.clientType !== undefined) {
      dispatch(setCurrentUser(user));
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
        dispatch(setCurrentUser(userWithClientInfo));
        setTimeout(() => setShowAuthLoading(false), 2000);
      } catch (error) {
        console.error("Error fetching client info for user:", error);
        dispatch(setCurrentUser(user));
        setTimeout(() => setShowAuthLoading(false), 2000);
      }
    } else {
      dispatch(setCurrentUser(user));
      setTimeout(() => setShowAuthLoading(false), 2000);
    }
  }).current;

  // Add setUser function that can be called directly
  const handleSetUser = (user: User | null) => {
    dispatch(setCurrentUser(user));
  };

  // Import useAuthHandlers
  const { handleUserAuthentication } = useAuthHandlers({
    user: currentUser,
    users,
    setUser: (user: User | null) => dispatch(setCurrentUser(user)),
    setUsers: setUsersState,
    setAuthError: (error: string | null) => dispatch(setAuthError(error)),
    authInitCompleteRef,
    setEmployeeData: (employeeData: EmployeeData | null) => dispatch(setEmployeeData(employeeData)),
    dispatch
  });

  // Setup Supabase auth listener for SSO authentication with enhanced logout handling
  useEffect(() => {
    if (authListenerSetupRef.current) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // CRITICAL: Block auth processing during logout but ALLOW during legitimate login
      if (state.isLoggingOut || authCoordinator.isLogoutInProgress()) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Set login in progress flag to prevent session validation interference
        sessionStorage.setItem('is_login_in_progress', 'true');
        localStorage.setItem('is_login_in_progress', 'true');
        
        setIsProcessingAuth(true);
        setShowAuthLoading(true);
        
        // Use setTimeout to avoid blocking the auth state change callback
        setTimeout(async () => {
          try {
            // Double-check logout state before proceeding
            if (state.isLoggingOut || authCoordinator.isLogoutInProgress()) {
              setIsProcessingAuth(false);
              setShowAuthLoading(false);
              sessionStorage.removeItem('is_login_in_progress');
              localStorage.removeItem('is_login_in_progress');
              return;
            }

            await handleUserAuthentication(session.user);
            
            // Store SSO session data in localStorage for persistence
            const authStateToSave = {
              currentUser: currentUser,
              isAuthenticated: true,
              isBackofficeUser: false,
              authError: null,
              configuredModules: state.configuredModules,
              employeeData: state.employeeData,
              sessionType: 'sso' as const
            };
            
            // Import and use saveAuthState with localStorage for SSO
            const { saveAuthState } = await import('@/store/authPersistence');
            saveAuthState(authStateToSave);
            
            setTimeout(() => setShowAuthLoading(false), 1500);
          } catch (error) {
            toast.error("Authentication failed. Please try again.");
            setShowAuthLoading(false);
          } finally {
            setIsProcessingAuth(false);
            // Clear login in progress flags
            sessionStorage.removeItem('is_login_in_progress');
            localStorage.removeItem('is_login_in_progress');
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        // Only process SIGNED_OUT if it's not part of our own logout process
        if (!state.isLoggingOut && !authCoordinator.isLogoutInProgress()) {
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          setShowAuthLoading(false);
          setIsProcessingAuth(false);
          toast.info("You have been logged out");
          logoutUser();
        }
      }
    });
    
    authListenerSetupRef.current = true;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication, dispatch, currentUser, state.isLoggingOut, state.configuredModules, state.employeeData]);

  // Check Supabase auth on initialization and handle persisted state
  useEffect(() => {
    // Prevent infinite loops and respect coordinator blocks
    if (initializationCompleteRef.current || 
        authCheckInProgressRef.current) {
      return;
    }

    const checkSupabaseAuth = async () => {
      if (authCheckInProgressRef.current) return;
      authCheckInProgressRef.current = true;
      initializationCompleteRef.current = true; // Mark as complete immediately to prevent re-runs
      
      try {
        // Skip all operations on login routes
        const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
        
        // Skip all validation and clearing on login routes
        if (isOnLoginRoute) {
          setIsInitializing(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        
        if (data.session && !currentUser) {
          setShowAuthLoading(true);
          setTimeout(async () => {
            await handleUserAuthentication(data.session?.user);
            setTimeout(() => setShowAuthLoading(false), 2000);
          }, 0);
        }
      } catch (error) {
        // Don't show error toast during initialization to prevent spam
      } finally {
        setIsInitializing(false);
        authCheckInProgressRef.current = false;
      }
    };

    checkSupabaseAuth();
  }, []); // Empty dependency array to run only once

  // Handle login - REMOVED backoffice logic, now only handles regular users and SSO
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    dispatch(setAuthError(null));
    setShowAuthLoading(true);
    
    try {
      // Only try to login as a regular user (no backoffice logic here)
      const user = loginUser(email, password, users);

      if (user) {
        await setCurrentUserWithClientInfo(user);
        
        // Fetch employee data after successful login
        try {
          dispatch(setLoading(true));
          
          const cleanedEmail = email.trim().replace(/[\n\r\t]/g, '').toLowerCase();
          const { data: employeeData, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type')
            .eq('email', cleanedEmail)
            .single();
          
          if (employeeData && !error) {
            const { client, clientType } = await fetchClientInfo(employeeData.client_id);

            const employee: EmployeeData = {
              id: employeeData.id,
              clientId: employeeData.client_id,
              email: employeeData.email,
              firstName: employeeData.first_name,
              lastName: employeeData.last_name,
              isSuperAdmin: employeeData.is_super_admin,
              department: employeeData.department, 
              employeeType: employeeData.employee_type,
              client: client,
              clientType: clientType
            };
            
            dispatch(setEmployeeData(employee));
            saveEmployeeDataToStorage(employee);
            
            if (employee.clientId) {
              dispatch(setClientId(employee.clientId));
            }
          }
          
          dispatch(setLoading(false));
        } catch (err) {
          console.error("Error fetching employee data for regular user:", err);
          dispatch(setLoading(false));
        }
        
        setTimeout(() => setShowAuthLoading(false), 2000);
        return true;
      }

      // If regular login fails, return false (no more backoffice fallback here)
      dispatch(setAuthError("Invalid credentials"));
      setShowAuthLoading(false);
      return false;
      
    } catch (error) {
      console.error("Login error:", error);
      dispatch(setAuthError("Login failed"));
      toast.error("Login failed");
      setShowAuthLoading(false);
      return false;
    }
  };

  // Enhanced SSO logout with proper sequence and state management
  const handleLogout = async (): Promise<void> => {
    // Check if logout is already in progress
    if (!authCoordinator.startLogout()) {
      return;
    }
    
    // Set logout state immediately to prevent validation loops and redirects
    dispatch(setLogoutState(true));
    console.log('🔒 AuthProvider: Set logout state to true');
    
    try {
      // PHASE 1: Clear application state first (prevents re-auth triggers)
      console.log('🧹 AuthProvider: Phase 1 - Clearing application state');
      dispatch(clearAuth());
      dispatch(resetEmployee());
      
      // PHASE 2: Clear all storage (both localStorage and sessionStorage)
      console.log('🗑️ AuthProvider: Phase 2 - Clearing all storage');
      clearPersistedAuthState(); // Clears both localStorage and sessionStorage
      logoutUser(); // Clear additional local storage items
      
      // PHASE 3: Sign out from Supabase (for SSO users)
      if (!isBackofficeUser) {
        try {
          console.log('🔐 AuthProvider: Phase 3 - Signing out from Supabase');
          await supabase.auth.signOut();
          console.log('✅ AuthProvider: Supabase logout completed');
        } catch (supabaseError) {
          console.error('❌ AuthProvider: Error signing out from Supabase:', supabaseError);
          // Continue with logout process even if Supabase signout fails
        }
      }
      
      // PHASE 4: Navigate to login page
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      const shouldRedirectToBackoffice = isBackofficeUser || isCurrentlyBackoffice;
      const targetPath = shouldRedirectToBackoffice ? '/backoffice/login' : '/login';
      
      console.log('🧭 AuthProvider: Phase 4 - Navigation logic', {
        isCurrentlyBackoffice,
        shouldRedirectToBackoffice,
        targetPath,
        currentPath: location.pathname
      });
      
      // Navigate with proper coordination
      if (authCoordinator.canNavigate(targetPath)) {
        console.log('🧭 AuthProvider: Navigating to login page:', targetPath);
        if (shouldRedirectToBackoffice) {
          navigate('/backoffice/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } else {
        console.log('🚫 AuthProvider: Navigation blocked by coordinator - attempting emergency reset');
        authCoordinator.emergencyReset();
        // Try navigation again after emergency reset
        navigate(targetPath, { replace: true });
      }
      
      // Show logout success message
      toast.success("Successfully logged out");
      
      // PHASE 5: Reset coordination flags after navigation
      setTimeout(() => {
        authCoordinator.endLogout();
        dispatch(setLogoutState(false));
        authCoordinator.resetRedirectCounter(); // Reset redirect counter for fresh start
        console.log('✅ AuthProvider: Logout completed and all flags cleared');
      }, 1500); // Slightly longer delay for navigation to complete
      
    } catch (error) {
      console.error('❌ AuthProvider: Error during logout:', error);
      toast.error("Error during logout");
      
      // Clear logout flags even on error
      setTimeout(() => {
        authCoordinator.endLogout();
        dispatch(setLogoutState(false));
      }, 1000);
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
      toast.error("No user logged in");
      return false;
    }

    const updatedUsers = changeUserPassword(users, currentUser.id, currentPassword, newPassword);
    
    if (updatedUsers) {
      setUsersState(updatedUsers);
      toast.success("Password changed successfully");
      return true;
    } else {
      toast.error("Current password is incorrect");
      return false;
    }
  };

  // Context value with useMemo to ensure updates when Redux state changes
  const contextValue: AuthContextType = useMemo(() => ({
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
    employeeData: state.employeeData,
    setUser: handleSetUser,
    isProcessingAuth,
  }), [
    currentUser,
    displayUsers, 
    isAdmin,
    isSaasOwner,
    authError,
    state.employeeData,
    isProcessingAuth
  ]);

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
