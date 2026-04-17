import React, { createContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { User, AuthContextType, UserWithPassword, EmployeeData, Client, ClientType, ClientIntegration, LogoutReason } from './types';
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
  const crossTabSyncRef = useRef<boolean>(false);
  const currentTabIdRef = useRef<string>(`tab_${Date.now()}_${Math.random()}`);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const ALL_TAB_SYNC_ENABLED =import.meta.env.VITE_ALL_TAB_LOGIN_LOGOUT === 'true';

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
  const fetchClientInfo = useRef(async (clientId: string): Promise<{ client: Client | null, clientType: ClientType | null, clientIntegration: ClientIntegration[] | null }> => {
    try {
      // Fetch client information with client type and client integration
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
        return { client: null, clientType: null, clientIntegration: null };
      }

      // Fetch client integration records using RPC function to bypass RLS
      let clientIntegration: ClientIntegration[] | null = null;
      try {
        console.log('🔍 Fetching client_integration for client_id:', clientId);
        const { data: integrationData, error: integrationError } = await (supabase as any)
          .rpc('get_client_integration_for_auth', { p_client_id: clientId });

        if (integrationError) {
          console.error("❌ Error fetching client integration:", {
            error: integrationError,
            message: integrationError.message,
            code: integrationError.code,
            details: integrationError.details,
            hint: integrationError.hint,
            clientId: clientId
          });
          // If function doesn't exist, log a helpful message
          if (integrationError.message?.includes('function') || integrationError.code === '42883') {
            console.error("⚠️ The RPC function 'get_client_integration_for_auth' may not exist. Please run the migration: 20260110000000_create_get_client_integration_for_auth_function.sql");
          }
        } else if (integrationData && Array.isArray(integrationData)) {
          if (integrationData.length > 0) {
            clientIntegration = integrationData.map((item: any) => ({
              id: item.id,
              client_id: item.client_id,
              target_client_id: item.target_client_id,
              target_client_name: item.target_client_name,
              is_linked: item.is_linked,
              active: item.active,
              created_at: item.created_at,
              updated_at: item.updated_at,
              updated_by: item.updated_by
            }));
            console.log('✅ Client integration fetched:', {
              count: clientIntegration.length,
              records: clientIntegration,
              clientId: clientId
            });
          } else {
            console.log('ℹ️ No client integration records found for client:', clientId);
          }
        } else {
          console.log('ℹ️ Client integration data is not an array or is null:', {
            data: integrationData,
            clientId: clientId
          });
        }
      } catch (integrationErr) {
        console.error("❌ Exception fetching client integration:", {
          error: integrationErr,
          clientId: clientId,
          stack: integrationErr instanceof Error ? integrationErr.stack : undefined
        });
        // Continue with null integration if fetch fails
        clientIntegration = null;
      }


      // Build logo URL from path if needed
      const { buildClientLogoUrl } = await import('@/lib/utils');
      const logoUrl = buildClientLogoUrl(clientData.logo || clientData.client_logo);
      
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
        logo: logoUrl,
        client_type: clientData.client_type,
        client_integration: clientIntegration,

      };

      const clientType: ClientType | null = clientData.client_type ? {
        id: clientData.client_type.id,
        name: clientData.client_type.name,
        key: clientData.client_type.key,
        created_at: clientData.client_type.created_at,
        updated_at: clientData.client_type.updated_at
      } : null;

      return { client, clientType, clientIntegration };
    } catch (error) {
      console.error("Error in fetchClientInfo:", error);
      return { client: null, clientType: null, clientIntegration: null };
    }
  }).current;

  // Enhanced setCurrentUser function that ensures client info is included
  const setCurrentUserWithClientInfo = useRef(async (user: User | null) => {
    if (!user) {
      dispatch(setCurrentUser(null));
      return;
    }

    setShowAuthLoading(true);

    const clientMissingAiFlag =
      user.client &&
      typeof user.client === 'object' &&
      user.client.incidentRecommendedActionsEnabled === undefined;

    // If user already has client info including AI feature flag, use it directly
    if (
      user.client !== undefined &&
      user.clientType !== undefined &&
      !clientMissingAiFlag
    ) {
      dispatch(setCurrentUser(user));
      setShowAuthLoading(false);
      return;
    }

    // Fetch full client when missing, or when client exists but predates incidentRecommendedActionsEnabled
    if (user.clientId && (!user.client || clientMissingAiFlag)) {
      try {
        const { client, clientType } = await fetchClientInfo(user.clientId);
        const userWithClientInfo = {
          ...user,
          client: client ?? user.client,
          clientType: clientType ?? user.clientType,
        };
        dispatch(setCurrentUser(userWithClientInfo));
        setShowAuthLoading(false);
      } catch (error) {
        console.error("Error fetching client info for user:", error);
        dispatch(setCurrentUser(user));
        setShowAuthLoading(false);
      }
    } else {
      dispatch(setCurrentUser(user));
      setShowAuthLoading(false);
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
    dispatch,
    navigate
  });

  const broadcastToOtherTabs = useCallback((type: string) => {
    if (typeof BroadcastChannel !== 'undefined') {
      if (!broadcastChannelRef.current) {
        if (!ALL_TAB_SYNC_ENABLED) return;

        broadcastChannelRef.current = new BroadcastChannel('supabase_auth_channel');      
      }
      
      broadcastChannelRef.current.postMessage({
        type,
        tabId: currentTabIdRef.current,
        timestamp: Date.now()
      });
    }
  }, []);

  const handleLoginBroadcast = useCallback(() => {
    if (!ALL_TAB_SYNC_ENABLED) return;
    broadcastToOtherTabs('LOGIN');
    setTimeout(() => {
      localStorage.setItem(
        'supabase.auth.trigger-sync',
        Date.now().toString()
      );
    }, 50);
  }, [broadcastToOtherTabs]);

const handleLogoutBroadcast = useCallback(() => {
  if (!ALL_TAB_SYNC_ENABLED) return;
    broadcastToOtherTabs('LOGOUT');
  }, [broadcastToOtherTabs]);

  const handleLogoutSync = useRef(async (): Promise<void> => {
    try {
      if (isBackofficeUser || location.pathname.startsWith('/backoffice')) {
        console.log('🔄 Cross-tab sync: Skipping logout sync for backoffice custom session');
        return;
      }

      console.log('🔄 Cross-tab sync: Processing logout sync');
      
      dispatch(clearAuth());
      dispatch(resetEmployee());
      
      localStorage.removeItem('authState');
      localStorage.removeItem('employeeData');
      
      sessionStorage.clear();
      
      localStorage.removeItem('supabase.auth.token');
      
      const shouldRedirectToBackoffice = isBackofficeUser || location.pathname.startsWith('/backoffice');
      const targetPath = shouldRedirectToBackoffice ? '/backoffice/login' : '/login';
      
      navigate(targetPath, { replace: true });
      
      toast.info("Logged out from another tab");
      
    } catch (error) {
      console.error('Sync logout error:', error);
    }
  }).current;

  const handleLoginSync = useRef(async (): Promise<void> => {
    try {
      console.log('🔄 Cross-tab sync: Processing login sync');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !currentUser) {
        setShowAuthLoading(true);
        await handleUserAuthentication(session.user);
        setShowAuthLoading(false);
        
        toast.info("Logged in from another tab");
      }
    } catch (error) {
      console.error('Login sync error:', error);
    }
  }).current;

  useEffect(() => {
    if (!ALL_TAB_SYNC_ENABLED) {
      console.info('Cross-tab auth sync disabled via env');
      return;
    }
    if (crossTabSyncRef.current) return;
    crossTabSyncRef.current = true;

    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('supabase_auth_channel');
      
      const handleBroadcastMessage = (event: MessageEvent) => {
        const { type, tabId } = event.data;
        
        if (tabId === currentTabIdRef.current) return;
        if (isBackofficeUser || location.pathname.startsWith('/backoffice')) return;
        
        console.log(`📡 Received broadcast: ${type} from tab ${tabId}`);
        
        switch (type) {
          case 'LOGIN':
            handleLoginSync();
            break;
            
          case 'LOGOUT':
            handleLogoutSync();
            break;
            
          case 'SESSION_UPDATE':
            // Refresh session
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session && !currentUser) {
                handleLoginSync();
              } else if (!session && currentUser && !isBackofficeUser) {
                handleLogoutSync();
              }
            });
            break;
        }
      };

      broadcastChannelRef.current.addEventListener('message', handleBroadcastMessage);
    }

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (!ALL_TAB_SYNC_ENABLED) return;
      if (isBackofficeUser || location.pathname.startsWith('/backoffice')) return;
      // Skip changes from the current tab
      if (e.key?.startsWith('tab_') && e.key !== currentTabIdRef.current) {
        return;
      }

      // Handle auth state changes
      if (e.key === 'supabase.auth.token') {
        // When auth token changes in another tab, refresh session
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && !currentUser) {
              // Another tab logged in - sync this tab
              console.log('🔄 Storage event: Logging in from another tab');
              setShowAuthLoading(true);
              await handleUserAuthentication(session.user);
              setShowAuthLoading(false);
            } else if (!session && currentUser && !isBackofficeUser) {
              // Another tab logged out - sync this tab
              console.log('🔄 Storage event: Logging out from another tab');
              handleLogoutSync();
            }
          } catch (error) {
            console.error('Cross-tab sync error:', error);
          }
        }, 100);
      }

      if (e.key?.startsWith('supabase.auth.LOGOUT')) {
        if (!authCoordinator.isLogoutInProgress()) {
          console.log('🔄 Storage event: Processing logout from another tab');
          handleLogoutSync();
        }
      }

      if (e.key?.startsWith('supabase.auth.LOGIN')) {
        console.log('🔄 Storage event: Processing login from another tab');
        handleLoginSync();
      }

      if (e.key === 'supabase.auth.trigger-sync') {
        localStorage.removeItem('supabase.auth.trigger-sync');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !currentUser) {
            handleLoginSync();
          } else if (!session && currentUser && !isBackofficeUser) {
            handleLogoutSync();
          }
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const setupTabHeartbeat = () => {
      localStorage.setItem(currentTabIdRef.current, Date.now().toString());
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tab_') && key !== currentTabIdRef.current) {
          const timestamp = parseInt(localStorage.getItem(key) || '0');
          if (Date.now() - timestamp > 30000) {
            localStorage.removeItem(key);
          }
        }
      });
    };

    // Initial heartbeat
    setupTabHeartbeat();
    
    // Set up periodic heartbeat (every 10 seconds)
    const heartbeatInterval = setInterval(setupTabHeartbeat, 10000);

    const handleVisibilityChange = () => {
      if (isBackofficeUser || location.pathname.startsWith('/backoffice')) {
        return;
      }

      if (!document.hidden) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !currentUser) {
            setShowAuthLoading(true);
            handleUserAuthentication(session.user).finally(() => {
              setShowAuthLoading(false);
            });
          } else if (!session && currentUser && !isBackofficeUser) {
            handleLogoutSync();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for window focus
    window.addEventListener('focus', handleVisibilityChange);

    // Cleanup function
    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(heartbeatInterval);
      localStorage.removeItem(currentTabIdRef.current);
      crossTabSyncRef.current = false;
    };
  }, [currentUser, handleUserAuthentication, handleLoginSync, handleLogoutSync, location.pathname, isBackofficeUser, navigate]);

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
            handleLoginBroadcast();
            
            // Wait a bit for the session to be fully propagated before checking RLS context
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify session is still valid before calling RPC
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !currentSession) {
              console.error('❌ RLS DEBUG: No valid session found after login:', sessionError);
              return;
            }
            
            console.log('⚠️ RLS DEBUG: Starting RLS policy check after SSO login');
            
            // Log RLS context for debugging policies (auth.uid, client_id, backoffice flag)
            try {
              console.log('🔍 RLS DEBUG: Calling debug_current_rls_context RPC...');
              const { data: rlsDebug, error: rpcError } = await supabase.rpc('debug_current_rls_context');
              
              if (rpcError) {
                console.error('❌ RLS DEBUG: RPC call failed:', rpcError);
                console.error('❌ RLS DEBUG: Error details:', {
                  message: rpcError.message,
                  code: rpcError.code,
                  details: rpcError.details,
                  hint: rpcError.hint
                });
                return;
              }
              
              console.log('📊 RLS DEBUG: RPC response received:', rlsDebug);
              
              if (rlsDebug && Array.isArray(rlsDebug) && rlsDebug[0]) {
                console.log('✅ RLS DEBUG: RLS context (SSO login):', JSON.stringify(rlsDebug[0], null, 2));
              } else {
                console.warn('⚠️ RLS DEBUG: RLS context (SSO login): no data returned or empty array');
                console.warn('⚠️ RLS DEBUG: Response type:', typeof rlsDebug, 'Is array:', Array.isArray(rlsDebug));
              }
            } catch (rlsErr) {
              console.error('❌ RLS DEBUG: Exception fetching RLS debug context (SSO login):', rlsErr);
              console.error('❌ RLS DEBUG: Exception details:', {
                name: rlsErr instanceof Error ? rlsErr.name : 'Unknown',
                message: rlsErr instanceof Error ? rlsErr.message : String(rlsErr),
                stack: rlsErr instanceof Error ? rlsErr.stack : undefined
              });
            }
            
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
            
            setShowAuthLoading(false);
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
        if (isBackofficeUser || location.pathname.startsWith('/backoffice')) {
          console.log('🔐 Auth listener: Ignoring SIGNED_OUT for backoffice custom session');
          return;
        }
        // Only process SIGNED_OUT if it's not part of our own logout process
        if (!state.isLoggingOut && !authCoordinator.isLogoutInProgress()) {
          if (ALL_TAB_SYNC_ENABLED) {
            handleLogoutBroadcast();
          }
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          setShowAuthLoading(false);
          setIsProcessingAuth(false);
          toast.info("You have been logged out");
          logoutUser();
          const shouldRedirectToBackoffice = isBackofficeUser || location.pathname.startsWith('/backoffice');
          const targetPath = shouldRedirectToBackoffice ? '/backoffice/login' : '/login';
          navigate(targetPath, { replace: true });
        }
      } else if (event === 'TOKEN_REFRESHED') {
          if (ALL_TAB_SYNC_ENABLED) {
            broadcastToOtherTabs('SESSION_UPDATE');
          }      
        }
    });
    
    authListenerSetupRef.current = true;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserAuthentication, dispatch, currentUser, state.isLoggingOut, state.configuredModules, state.employeeData, handleLoginBroadcast, handleLogoutBroadcast, broadcastToOtherTabs, location.pathname, isBackofficeUser, navigate]);

  // Note: Realtime subscription for client_integration is now handled by useRealtimeClientIntegrationSync hook
  // which is called in ModuleSyncProvider. This ensures consistent behavior with module sync.

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
        const isOnBackofficeRoute = location.pathname.startsWith('/backoffice');
        
        // Skip all validation and clearing on login routes
        if (isOnLoginRoute || isOnBackofficeRoute) {
          setIsInitializing(false);
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          return;
        }

        const { ensureFreshAuthenticatedSession, getSupabaseTokenRole } = await import(
          '@/utils/sessionValidation'
        );

        const fresh = await ensureFreshAuthenticatedSession();
        if (!fresh.ok) {
          console.warn('[Auth init] Invalid or stale Supabase session — signing out', fresh.reason);
          await supabase.auth.signOut();
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          if (!isOnLoginRoute) {
            navigate('/login', { replace: true });
          }
          return;
        }

        if (getSupabaseTokenRole(fresh.session.access_token) !== 'authenticated') {
          console.log('[Auth init] RESTRICTED: JWT is not authenticated role — signing out');
          await supabase.auth.signOut();
          dispatch(clearAuth());
          dispatch(resetEmployee());
          clearPersistedAuthState();
          if (!isOnLoginRoute) {
            navigate('/login', { replace: true });
          }
          return;
        }

        if (!currentUser) {
          console.log('[Auth init] Session refreshed and authenticated — restoring user');
          setShowAuthLoading(true);
          setTimeout(async () => {
            await handleUserAuthentication(fresh.session.user);
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
        handleLoginBroadcast();
        
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
            const { client, clientType, clientIntegration } = await fetchClientInfo(employeeData.client_id);

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
              clientType: clientType,
              client_integration: clientIntegration
            };
            
            console.log('🔍 AuthProvider - Employee data loaded:', employee);
            
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
        
        setShowAuthLoading(false);
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

  // Simplified logout with immediate state clearing
  const handleLogout = async (reason?: LogoutReason, message?: string): Promise<void> => {
    // Check if logout is already in progress
    if (!authCoordinator.startLogout()) {
      return;
    }
    
    try {
      // Immediate state clearing - no setTimeout delays
      dispatch(setLogoutState(true)); 
      if (!isBackofficeUser && !location.pathname.startsWith('/backoffice')) {
        handleLogoutBroadcast();
      }
      dispatch(clearAuth());
      dispatch(resetEmployee());
      clearPersistedAuthState();
      logoutUser();
      
      // Sign out from Supabase (for SSO users)
      if (!isBackofficeUser && !location.pathname.startsWith('/backoffice')) {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('authState');
      }
      
      // Navigate immediately
      const shouldRedirectToBackoffice = isBackofficeUser || location.pathname.startsWith('/backoffice');
      const targetPath = shouldRedirectToBackoffice ? '/backoffice/login' : '/login';
      
      navigate(targetPath, { replace: true });
      
      // Show appropriate message based on logout reason
      if (reason === 'ip_not_whitelisted') {
        const errorMessage = message || 'Your IP address is not whitelisted for this client. Please contact your administrator to add your IP address to the whitelist.';
        toast.error(errorMessage);
      } else if (reason === 'session_expired') {
        toast.error(message || 'Your session has expired. Please log in again.');
      } else if (reason === 'employee_inactive') {
        toast.error(message || 'Your account is inactive. Please contact your administrator.');
      } else if (reason === 'client_inactive') {
        toast.error(message || 'Your organization account is inactive. Please contact your administrator.');
      } else if (reason === 'validation_failed') {
        toast.error(message || 'Validation failed. Please log in again.');
      } else {
        // Default success message for user-initiated logout
        toast.success("Successfully logged out");
      }
      
      // Clear logout state immediately after navigation
      setTimeout(() => {
        dispatch(setLogoutState(false));
        authCoordinator.endLogout();
        authCoordinator.resetRedirectCounter();
      }, 500);
      
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
    handleLogin,
    handleLogout,
    isAdmin,
    isSaasOwner,
    handleChangePassword,
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
