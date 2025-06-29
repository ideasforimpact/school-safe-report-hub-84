
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setClientId, setConfiguredModules, resetEmployee, setLoading, setLogoutState } from '@/store/employeeActions';
import { setCurrentUser, setBackofficeUser, setAuthStatus, setAuthError, clearAuth } from '@/store/authActions';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser, getAuthError } from '@/store/authSelectors';
import { clearPersistedAuthState } from '@/store/authPersistence';
import AuthLoadingOverlay from '@/components/auth/AuthLoadingOverlay';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const authInitCompleteRef = useRef<boolean>(false);
  const authListenerSetupRef = useRef<boolean>(false);
  const authCheckInProgressRef = useRef<boolean>(false);

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles from Redux state
  const isAdmin = Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  const isSaasOwner = Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);

  // Helper function to fetch backoffice modules
  const fetchBackofficeModules = async () => {
    try {
      console.log('🔄 AuthProvider: Fetching backoffice modules');
      
      const { data: modules, error } = await supabase
        .from('modules')
        .select('*')
        .eq('active', true)
        .eq('level', 'backoffice')
        .order('order', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching backoffice modules:', error);
        return [];
      }

      if (!modules || modules.length === 0) {
        console.log('⚠️ AuthProvider: No backoffice modules found in database');
        return [];
      }

      console.log('✅ AuthProvider: Fetched modules:', modules);

      // Convert modules to the format expected by the application
      const formattedModules = modules.map(module => ({
        id: module.id,
        name: module.name,
        key: module.name.toLowerCase().replace(/\s+/g, '_'), // Generate key from name
        icon: module.icon || 'Settings',
        level: 'admin',
        enabled: module.active, // Map 'active' to 'enabled'
        accessLevel: {},
        order: module.order || 999,
        url: module.url || `/${module.name.toLowerCase().replace(/\s+/g, '-')}`
      }));

      console.log('🔄 AuthProvider: Formatted modules:', formattedModules);
      return formattedModules;
    } catch (error) {
      console.error('Error in fetchBackofficeModules:', error);
      return [];
    }
  };

  // Helper function to fetch client and client type information
  const fetchClientInfo = async (clientId: string): Promise<{ client: Client | null, clientType: ClientType | null }> => {
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
  };

  // Enhanced setCurrentUser function that ensures client info is included
  const setCurrentUserWithClientInfo = async (user: User | null) => {
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
  };

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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip processing if logging out
      if (state.isLoggingOut) {
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
      } else if (event === 'SIGNED_OUT' && !state.isLoggingOut) {
        dispatch(clearAuth());
        dispatch(resetEmployee());
        clearPersistedAuthState();
        setShowAuthLoading(false);
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
    if (state.isLoggingOut || authCheckInProgressRef.current) return;

    const checkSupabaseAuth = async () => {
      if (authCheckInProgressRef.current) return;
      authCheckInProgressRef.current = true;
      
      try {
        // If we have persisted backoffice user state, skip Supabase checks
        if (isBackofficeUser && currentUser) {
          setIsInitializing(false);
          return;
        }

        // If we have persisted regular user state, still validate with Supabase
        if (currentUser && !isBackofficeUser) {
          // User exists, just validate
        }

        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (!currentUser) {
            setShowAuthLoading(true);
            setTimeout(async () => {
              await handleUserAuthentication(data.session?.user);
              setTimeout(() => setShowAuthLoading(false), 2000);
            }, 0);
          }
        } else {
          // If no Supabase session and no persisted user (or not backoffice), clear everything
          if (!currentUser || (!isBackofficeUser && currentUser)) {
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
        setIsInitializing(false);
        authCheckInProgressRef.current = false;
      }
    };

    checkSupabaseAuth();
  }, [currentUser, isBackofficeUser, isAuthenticated, handleUserAuthentication, dispatch, state.isLoggingOut]);

  // Handle login
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    dispatch(setAuthError(null));
    setShowAuthLoading(true);
    
    try {
      // First try to login as a regular user
      const user = loginUser(email, password, users);

      console.log(user,"Login via email and password");

      if (user) {
        await setCurrentUserWithClientInfo(user);
        
        // Fetch employee data after successful login
        try {
          dispatch(setLoading(true));
          
          const { data: employeeData, error } = await supabase
            .from('employees')
            .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type')
            .eq('email', email.toLowerCase())
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

      // If regular login fails, try backoffice login
      const { data, error } = await supabase.rpc('verify_password', { 
        email, 
        password_attempt: password 
      });

      if (error) {
        dispatch(setAuthError("Invalid credentials"));
        setShowAuthLoading(false);
        return false;
      }

      if (data === true) {
        console.log('🔄 AuthProvider: Starting backoffice login process');
        
        // Fetch the backoffice user
        const { data: backofficeUser, error: backofficeError } = await supabase
          .from('backoffice_users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (backofficeError || !backofficeUser) {
          dispatch(setAuthError("Error retrieving user data"));
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
        
        console.log('✅ AuthProvider: Created backoffice user:', saasUser);
        
        // Update Redux state - CRITICAL: Set these in correct order
        dispatch(setCurrentUser(saasUser));
        dispatch(setBackofficeUser(true));
        dispatch(setAuthStatus(true));
        
        // Create employee data for backoffice user - CRITICAL: Proper structure
        const backofficeEmployeeData: EmployeeData = {
          id: backofficeUser.id,
          clientId: null, // Backoffice users don't have a client
          email: backofficeUser.email,
          firstName: 'Backoffice',
          lastName: 'Admin',
          isSuperAdmin: true,
          department: 'Management',
          employeeType: 'admin',
          client: null,
          clientType: null
        };
        
        console.log('✅ AuthProvider: Created backoffice employee data:', backofficeEmployeeData);
        
        // CRITICAL: Dispatch employee data to Redux using proper action creator
        dispatch(setEmployeeData(backofficeEmployeeData));
        saveEmployeeDataToStorage(backofficeEmployeeData);
        
        // Fetch and set modules for backoffice user - CRITICAL: This was missing proper dispatch
        console.log('🔄 AuthProvider: Fetching backoffice modules');
        const backofficeModules = await fetchBackofficeModules();
        
        if (backofficeModules.length > 0) {
          console.log('✅ AuthProvider: Setting backoffice modules:', backofficeModules);
          // CRITICAL: Use proper action creator for modules
          dispatch(setConfiguredModules(backofficeModules));
        } else {
          console.log('⚠️ AuthProvider: No modules found, setting default modules');
          // Set default modules if none found
          const defaultModules = [
            {
              id: 'dashboard-admin',
              name: 'Dashboard',
              key: 'dashboard',
              icon: 'LayoutDashboard',
              level: 'admin',
              enabled: true,
              accessLevel: {},
              order: 1,
              url: '/dashboard'
            },
            {
              id: 'clients-admin',
              name: 'Clients',
              key: 'clients',
              icon: 'Building2',
              level: 'admin',
              enabled: true,
              accessLevel: {},
              order: 2,
              url: '/clients'
            },
            {
              id: 'modules-admin',
              name: 'Modules',
              key: 'modules',
              icon: 'Package',
              level: 'admin',
              enabled: true,
              accessLevel: {},
              order: 3,
              url: '/modules'
            },
            {
              id: 'settings-admin',
              name: 'Settings',
              key: 'settings',
              icon: 'Settings',
              level: 'admin',
              enabled: true,
              accessLevel: {},
              order: 4,
              url: '/settings'
            }
          ];
          
          dispatch(setConfiguredModules(defaultModules));
        }
        
        console.log('✅ AuthProvider: Backoffice login completed successfully');
        console.log('🔍 AuthProvider: Final Redux state:', {
          currentUser: saasUser,
          isBackofficeUser: true,
          employeeData: backofficeEmployeeData,
          modules: backofficeModules.length > 0 ? backofficeModules : 'default modules'
        });
        
        setTimeout(() => setShowAuthLoading(false), 2000);
        return true;
      }

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

  // Context value
  const contextValue: AuthContextType = {
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
    setUser: handleSetUser, // Enhanced setUser with logging
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
