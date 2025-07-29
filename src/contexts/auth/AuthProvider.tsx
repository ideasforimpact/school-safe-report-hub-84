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
  
  // Use session refresh hook for automatic session validation (only for backoffice users)
  const { refreshSession } = useSessionRefresh(isBackofficeUser ? 5 : 15); // More frequent for backoffice

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

  // Add setUser function that can be called directly with enhanced logging
  const handleSetUser = (user: User | null) => {
    console.log('🔄 AuthProvider: Setting user to:', user);
    console.log('🕐 AuthProvider: setUser called at:', new Date().toISOString());
    dispatch(setCurrentUser(user));
    
    // Add a small delay to verify state propagation
    setTimeout(() => {
      console.log('✅ AuthProvider: User state after setUser:', currentUser);
    }, 100);
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

  // Setup Supabase auth listener for Google authentication
  useEffect(() => {
    if (authListenerSetupRef.current || state.isLoggingOut) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip processing if logging out
      if (state.isLoggingOut) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 User signed in via SSO:', session.user.email);
        setIsProcessingAuth(true);
        setShowAuthLoading(true);
        
        // Use setTimeout to avoid blocking the auth state change callback
        setTimeout(async () => {
          try {
            await handleUserAuthentication(session.user);
            
            // After successful SSO authentication, save with SSO session type
            const authStateToSave = {
              currentUser: currentUser,
              isAuthenticated: true,
              isBackofficeUser: false,
              authError: null,
              configuredModules: state.configuredModules,
              employeeData: state.employeeData,
              sessionType: 'sso' as const
            };
            
            // Import and use saveAuthState
            const { saveAuthState } = await import('@/store/authPersistence');
            saveAuthState(authStateToSave);
            
            setTimeout(() => setShowAuthLoading(false), 2000);
          } catch (error) {
            console.error("Error in handleUserAuthentication:", error);
            toast.error("Authentication failed. Please try again.");
            setShowAuthLoading(false);
          } finally {
            setIsProcessingAuth(false);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT' && !state.isLoggingOut) {
        dispatch(clearAuth());
        dispatch(resetEmployee());
        clearPersistedAuthState();
        setShowAuthLoading(false);
        setIsProcessingAuth(false);
        toast.info("You have been logged out");
        logoutUser();
      }
    });
    
    authListenerSetupRef.current = true;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication, dispatch, state.isLoggingOut]);

  // Check Supabase auth on initialization and handle persisted state
  useEffect(() => {
    // Prevent infinite loops by only running initialization once
    if (initializationCompleteRef.current || state.isLoggingOut || authCheckInProgressRef.current) {
      console.log('🔄 AuthProvider: Skipping initialization', { 
        initComplete: initializationCompleteRef.current,
        isLoggingOut: state.isLoggingOut,
        inProgress: authCheckInProgressRef.current
      });
      return;
    }

    const checkSupabaseAuth = async () => {
      if (authCheckInProgressRef.current) return;
      authCheckInProgressRef.current = true;
      initializationCompleteRef.current = true; // Mark as complete immediately to prevent re-runs
      
      try {
        // Skip session validation on login routes to prevent errors
        const isOnLoginRoute = location.pathname === '/login' || location.pathname === '/backoffice/login';
        
        console.log('🔄 AuthProvider: Starting one-time initialization check', { 
          pathname: location.pathname,
          isOnLoginRoute,
          isBackofficeUser,
          hasCurrentUser: !!currentUser,
          timestamp: new Date().toISOString()
        });
        
        // Skip all validation and clearing on login routes
        if (isOnLoginRoute) {
          console.log('🔄 AuthProvider: On login route, skipping validation');
          setIsInitializing(false);
          return;
        }
        
        // Check if logout is in progress via sessionStorage
        const logoutInProgress = sessionStorage.getItem('is_logout_initiated') === 'true';
        if (logoutInProgress) {
          console.log('🔄 AuthProvider: Logout in progress, skipping initialization');
          setIsInitializing(false);
          return;
        }
        
        // If we have persisted user state, validate session using appropriate method
        if (currentUser) {
          console.log('🔄 AuthProvider: User found, validating session', { isBackofficeUser });
          
          // Add a small delay to prevent race conditions with logout
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check logout flag again after delay
          if (sessionStorage.getItem('is_logout_initiated') === 'true' || state.isLoggingOut) {
            console.log('🔄 AuthProvider: Logout detected during delay, aborting validation');
            setIsInitializing(false);
            return;
          }
          
          const isValidSession = await validateSession();
          if (!isValidSession && !state.isLoggingOut) {
            console.log('🔄 AuthProvider: Session expired during initialization');
            dispatch(clearAuth());
            dispatch(resetEmployee());
            clearPersistedAuthState();
            toast.error("Your session has expired. Please login again.");
          }
          setIsInitializing(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (!currentUser && !state.isLoggingOut) {
            console.log('🔄 AuthProvider: Supabase session found, no current user, authenticating');
            setShowAuthLoading(true);
            setTimeout(async () => {
              if (!state.isLoggingOut) {
                await handleUserAuthentication(data.session?.user);
                setTimeout(() => setShowAuthLoading(false), 2000);
              }
            }, 0);
          }
        } else {
          // If no Supabase session and no persisted user (or not backoffice), clear everything
          if (!currentUser || (!isBackofficeUser && currentUser)) {
            console.log('🔄 AuthProvider: No session, clearing auth state');
            dispatch(clearAuth());
            dispatch(resetEmployee());
            clearPersistedAuthState();
            logoutUser();
          }
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        toast.error("Error checking authentication status");
      } finally {
        console.log('🔄 AuthProvider: Initialization complete');
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

  // Handle logout with proper navigation and cleanup
  const handleLogout = async (): Promise<void> => {
    console.log('🚪 AuthProvider: Starting logout process');
    console.log('🕐 AuthProvider: Logout started at:', new Date().toISOString());
    
    // Set logout flag immediately to prevent redirect loops
    sessionStorage.setItem('is_logout_initiated', 'true');
    console.log('🏁 AuthProvider: Set logout flag in sessionStorage');
    
    // Reset validation state manager to prevent validation conflicts
    const { validationStateManager } = await import('@/utils/validationStateManager');
    validationStateManager.reset();
    console.log('🔄 AuthProvider: Reset validation state manager');
    
    // Set logout state immediately to prevent validation loops and redirects
    dispatch(setLogoutState(true));
    console.log('🔒 AuthProvider: Set logout state to true');
    
    try {
      // Clear Redux state immediately
      console.log('🧹 AuthProvider: Clearing Redux state');
      dispatch(clearAuth());
      dispatch(resetEmployee());
      
      // Clear persisted state
      console.log('🗑️ AuthProvider: Clearing persisted state');
      clearPersistedAuthState();
      
      // Clear local storage
      console.log('💾 AuthProvider: Clearing local storage');
      logoutUser();
      
      // For non-backoffice users, sign out from Supabase
      if (!isBackofficeUser) {
        try {
          console.log('🔐 AuthProvider: Signing out from Supabase');
          await supabase.auth.signOut();
        } catch (supabaseError) {
          console.error('Error signing out from Supabase:', supabaseError);
        }
      }
      
      // Determine where to redirect based on user type and current route
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      const shouldRedirectToBackoffice = isBackofficeUser || isCurrentlyBackoffice;
      
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
    } finally {
      // Reset logout state after a short delay
      setTimeout(() => {
        console.log('🔓 AuthProvider: Resetting logout state to false');
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
