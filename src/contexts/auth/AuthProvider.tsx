
import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  const logoutCompletedRef = useRef<boolean>(false);

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles from Redux state
  const isAdmin = Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  const isSaasOwner = Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);

  // Helper function to fetch client and client type information
  const fetchClientInfo = useCallback(async (clientId: string): Promise<{ client: Client | null, clientType: ClientType | null }> => {
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
      return { client: null, clientType: null };
    }
  }, []);

  // Enhanced setCurrentUser function that ensures client info is included
  const setCurrentUserWithClientInfo = useCallback(async (user: User | null) => {
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
        dispatch(setCurrentUser(user));
        setTimeout(() => setShowAuthLoading(false), 2000);
      }
    } else {
      dispatch(setCurrentUser(user));
      setTimeout(() => setShowAuthLoading(false), 2000);
    }
  }, [dispatch, fetchClientInfo]);

  // Memoize useAuthHandlers to prevent recreating on every render
  const memoizedSetUser = useCallback((user: User | null) => dispatch(setCurrentUser(user)), [dispatch]);
  const memoizedSetAuthError = useCallback((error: string | null) => dispatch(setAuthError(error)), [dispatch]);
  const memoizedSetEmployeeData = useCallback((employeeData: EmployeeData | null) => dispatch(setEmployeeData(employeeData)), [dispatch]);

  // Import useAuthHandlers with memoized functions
  const { handleUserAuthentication } = useAuthHandlers({
    user: currentUser,
    users,
    setUser: memoizedSetUser,
    setUsers: setUsersState,
    setAuthError: memoizedSetAuthError,
    authInitCompleteRef,
    setEmployeeData: memoizedSetEmployeeData,
    dispatch
  });

  // Memoize handleUserAuthentication to prevent useEffect dependencies from changing
  const memoizedHandleUserAuthentication = useCallback(handleUserAuthentication, [handleUserAuthentication]);

  // Setup Supabase auth listener for Google authentication
  useEffect(() => {
    if (authListenerSetupRef.current || state.isLoggingOut || logoutCompletedRef.current) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip processing if logging out or logout completed
      if (state.isLoggingOut || logoutCompletedRef.current) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setShowAuthLoading(true);
          setTimeout(async () => {
            await memoizedHandleUserAuthentication(session.user);
            setTimeout(() => setShowAuthLoading(false), 2000);
          }, 0);
        } catch (error) {
          toast.error("Authentication failed. Please try again.");
          setShowAuthLoading(false);
        }
      } else if (event === 'SIGNED_OUT' && !state.isLoggingOut && !logoutCompletedRef.current) {
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
  }, [memoizedHandleUserAuthentication, dispatch, state.isLoggingOut]);

  // Check Supabase auth on initialization and handle persisted state
  useEffect(() => {
    if (state.isLoggingOut || logoutCompletedRef.current) return;

    const checkSupabaseAuth = async () => {
      try {
        // If we have persisted backoffice user state, skip Supabase checks
        if (isBackofficeUser && currentUser) {
          setIsInitializing(false);
          return;
        }

        // If we have persisted regular user state, still validate with Supabase
        if (currentUser && !isBackofficeUser) {
          // Validate with Supabase
        }

        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (!currentUser) {
            setShowAuthLoading(true);
            setTimeout(async () => {
              await memoizedHandleUserAuthentication(data.session?.user);
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
        toast.error("Error checking authentication status");
      } finally {
        setIsInitializing(false);
      }
    };

    checkSupabaseAuth();
  }, [currentUser, isBackofficeUser, isAuthenticated, memoizedHandleUserAuthentication, dispatch, state.isLoggingOut]);

  // Handle login
  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch(setAuthError(null));
    setShowAuthLoading(true);
    
    try {
      // First try to login as a regular user
      const user = loginUser(email, password, users);

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
        
        // Update Redux state
        dispatch(setCurrentUser(saasUser));
        dispatch(setBackofficeUser(true));
        dispatch(setAuthStatus(true));
        
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
        
        dispatch(setEmployeeData(backofficeEmployeeData));
        saveEmployeeDataToStorage(backofficeEmployeeData);
        
        // Set modules for backoffice user
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
        
        dispatch(setConfiguredModules(backofficeModules));
        
        setTimeout(() => setShowAuthLoading(false), 2000);
        return true;
      }

      dispatch(setAuthError("Invalid credentials"));
      setShowAuthLoading(false);
      return false;
    } catch (error) {
      dispatch(setAuthError("Login failed"));
      toast.error("Login failed");
      setShowAuthLoading(false);
      return false;
    }
  }, [dispatch, users, setCurrentUserWithClientInfo, fetchClientInfo]);

  // Handle logout with proper navigation and cleanup
  const handleLogout = useCallback(async (): Promise<void> => {
    // Set logout state immediately to prevent validation loops
    dispatch(setLogoutState(true));
    logoutCompletedRef.current = true;
    
    try {
      // Determine where to redirect based on user type and current route
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      const shouldRedirectToBackoffice = isBackofficeUser || isCurrentlyBackoffice;
      
      // For non-backoffice users, sign out from Supabase first
      if (!isBackofficeUser) {
        try {
          await supabase.auth.signOut();
        } catch (supabaseError) {
          // Silent error handling
        }
      }
      
      // Clear Redux state immediately
      dispatch(clearAuth());
      dispatch(resetEmployee());
      
      // Clear persisted state
      clearPersistedAuthState();
      setShowAuthLoading(false);
      
      // Clear local storage
      logoutUser();
      
      // Navigate AFTER clearing state to prevent race conditions
      if (shouldRedirectToBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      
      toast.success('You have been logged out successfully');
      
    } catch (error) {
      toast.error('There was an error logging out');
      
      // Fallback navigation in case of error
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      if (isCurrentlyBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } finally {
      // Reset logout state after a brief delay
      setTimeout(() => {
        dispatch(setLogoutState(false));
        logoutCompletedRef.current = false;
      }, 1000);
    }
  }, [dispatch, isBackofficeUser, location.pathname, navigate]);

  // Memoize other handlers to prevent unnecessary re-renders
  const handleAddUser = useCallback((userData: any): void => {
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
  }, []);

  const handleUpdateUser = useCallback((id: string, updates: Partial<User & { password?: string }>): void => {
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
  }, []);

  const handleDeleteUser = useCallback((id: string): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.filter(user => user.id !== id);
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User deleted successfully");
  }, []);

  const handleDeactivateUser = useCallback((id: string): void => {
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
  }, []);

  const handleReactivateUser = useCallback((id: string): void => {
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
  }, []);

  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
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
  }, [currentUser, users]);

  // Memoize context value to prevent unnecessary re-renders
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
    handleUserAuthentication: memoizedHandleUserAuthentication,
    employeeData: state.employeeData,
  }), [
    currentUser,
    displayUsers,
    handleLogin,
    handleLogout,
    isAdmin,
    isSaasOwner,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleDeactivateUser,
    handleReactivateUser,
    handleChangePassword,
    authError,
    memoizedHandleUserAuthentication,
    state.employeeData
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
