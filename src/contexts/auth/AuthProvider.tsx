import React, { createContext, useEffect, useRef } from 'react';
import { User, AuthContextType, EmployeeData } from './types';
import { 
  logoutUser, 
  loginUser, 
  setUsers, 
  getUsersFromStorage,
  saveUsersToStorage,
  changeUserPassword,
  saveEmployeeDataToStorage
} from '@/services/auth/authService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setEmployeeData, setClientId, setConfiguredModules, resetEmployee, setLoading, setLogoutState } from '@/store/employeeActions';
import { setCurrentUser, setBackofficeUser, setAuthStatus, setAuthError, clearAuth } from '@/store/authActions';
import { getCurrentUser, getIsAuthenticated, getIsBackofficeUser, getAuthError, getEmployeeData } from '@/store/authSelectors';
import { clearPersistedAuthState } from '@/store/authPersistence';
import AuthLoadingOverlay from '@/components/auth/AuthLoadingOverlay';
import { useNavigate, useLocation } from 'react-router-dom';

// Create the context with async logout
export const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  login: async () => false,
  logout: async () => {},
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
  
  // Get authentication state directly from Redux
  const currentUser = getCurrentUser(state);
  const isAuthenticated = getIsAuthenticated(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const authError = getAuthError(state);
  const employeeData = getEmployeeData(state);
  
  // Local state only for users management and initialization
  const [users, setUsersState] = React.useState(getUsersFromStorage());
  const [displayUsers, setDisplayUsers] = React.useState(
    users.map(({ password, ...user }) => user)
  );
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [showAuthLoading, setShowAuthLoading] = React.useState(false);
  
  // Refs for preventing loops
  const authInitCompleteRef = useRef(false);
  const authListenerSetupRef = useRef(false);
  const authCheckInProgressRef = useRef(false);

  // Update display users whenever users changes
  useEffect(() => {
    setDisplayUsers(users.map(({ password, ...user }) => user));
  }, [users]);

  // Compute roles directly from Redux state
  const isAdmin = React.useMemo(() => {
    return Boolean(currentUser?.role === 'admin' || currentUser?.modulePermissions?.superAdmin);
  }, [currentUser]);

  const isSaasOwner = React.useMemo(() => {
    return Boolean(currentUser?.role === 'saas_owner' || isBackofficeUser);
  }, [currentUser, isBackofficeUser]);

  // Helper function to fetch client and client type information
  const fetchClientInfo = async (clientId: string) => {
    try {
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

      const client = {
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

      const clientType = clientData.client_type ? {
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

  // Simplified setCurrentUser that works with Redux
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

  // Direct setUser function that updates Redux
  const handleSetUser = (user: User | null) => {
    dispatch(setCurrentUser(user));
  };

  // Enhanced setEmployeeData function that updates Redux and saves to storage
  const handleSetEmployeeData = (employeeData: EmployeeData | null) => {
    dispatch(setEmployeeData(employeeData));
    if (employeeData) {
      saveEmployeeDataToStorage(employeeData);
    }
  };

  // Import useAuthHandlers with UNIFIED authentication
  const { handleUserAuthentication } = useAuthHandlers({
    user: currentUser,
    users,
    setUser: (user: User | null) => dispatch(setCurrentUser(user)),
    setUsers: setUsersState,
    setAuthError: (error: string | null) => dispatch(setAuthError(error)),
    authInitCompleteRef,
    setEmployeeData: handleSetEmployeeData,
    dispatch
  });

  // Setup Supabase auth listener for Google authentication
  useEffect(() => {
    if (authListenerSetupRef.current || state.isLoggingOut) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (state.isLoggingOut) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setShowAuthLoading(true);
          setTimeout(async () => {
            await handleUserAuthentication(session.user, false);
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

        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (!currentUser) {
            setShowAuthLoading(true);
            setTimeout(async () => {
              await handleUserAuthentication(data.session?.user, false);
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

  // Handle login - SIMPLIFIED TO ONLY HANDLE REGULAR USERS
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    dispatch(setAuthError(null));
    setShowAuthLoading(true);
    
    try {
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
            
            handleSetEmployeeData(employee);
            
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
    dispatch(setLogoutState(true));
    
    try {
      // Clear Redux state immediately
      dispatch(clearAuth());
      dispatch(resetEmployee());
      
      // Clear persisted state
      clearPersistedAuthState();
      
      // Clear local storage
      logoutUser();
      
      // For non-backoffice users, sign out from Supabase
      if (!isBackofficeUser) {
        try {
          await supabase.auth.signOut();
        } catch (supabaseError) {
          console.error('Error signing out from Supabase:', supabaseError);
        }
      }
      
      // Navigate immediately after clearing state
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      const shouldRedirectToBackoffice = isBackofficeUser || isCurrentlyBackoffice;
      
      if (shouldRedirectToBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      
      toast.success('You have been logged out successfully');
      
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('There was an error logging out');
      
      const isCurrentlyBackoffice = location.pathname.startsWith('/backoffice');
      if (isCurrentlyBackoffice) {
        navigate('/backoffice/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } finally {
      setTimeout(() => {
        dispatch(setLogoutState(false));
      }, 1000);
    }
  };

  // User management functions
  const handleAddUser = (userData: any): void => {
    const newUser = { 
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

  const handleDeleteUser = (id: string): void => {
    setUsersState(prevUsers => {
      const updatedUsers = prevUsers.filter(user => user.id !== id);
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      return updatedUsers;
    });
    toast.success("User deleted successfully");
  };

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

  // Context value - using Redux state directly with memoization to ensure updates
  const contextValue: AuthContextType = React.useMemo(() => ({
    user: currentUser,
    users: displayUsers,
    login: handleLogin,
    logout: handleLogout,
    isAdmin,
    isSaasOwner,
    addUser: () => {},
    updateUser: () => {},
    deleteUser: () => {},
    deactivateUser: () => {},
    reactivateUser: () => {},
    changePassword: async () => false,
    authError,
    handleUserAuthentication,
    employeeData,
    setUser: handleSetUser,
  }), [
    currentUser, 
    displayUsers, 
    isAdmin, 
    isSaasOwner, 
    authError, 
    employeeData,
    handleUserAuthentication
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
