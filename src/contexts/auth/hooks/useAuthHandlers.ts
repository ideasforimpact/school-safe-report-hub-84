import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData, Client, ClientType, DepartmentType, EmployeeType } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setConfiguredModules, setLoading, setError, resetEmployee, setClientId } from '@/store/employeeActions';
import { EmployeeActionTypes } from '@/store/types';
import { Module } from '@/store/types';
import { extractDomain, isEmailDomainAllowed } from '@/utils/authProviders';
import { saveAuthState } from '@/store/authPersistence';

// Define the SupabaseUser type that's missing
interface SupabaseUser {
  id: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
  email?: string;
  created_at?: string;
}

interface UseAuthHandlersProps {
  user: User | null;
  users: any[];
  setUser: (user: User | null) => void;
  setUsers: (users: any[]) => void;
  setAuthError: (error: string | null) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  setEmployeeData: (employeeData: EmployeeData | null) => void;
  dispatch?: any; // Add dispatch prop for Redux actions
}

export const useAuthHandlers = ({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  setEmployeeData,
  dispatch
}: UseAuthHandlersProps) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

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
  }, []);
  
  // New function to fetch configured modules for an employee
  const fetchConfiguredModules = useCallback(async (employeeId: string, clientId: string | null, isSuperAdmin: boolean) => {
    try {
      if (!clientId) {
        if (dispatch) dispatch(setError("Client ID is missing"));
        return [];
      }
      
      let configuredModules: Module[] = [];
      
      if (isSuperAdmin) {
        // For super admins, fetch all modules enabled for the client
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level, order, url)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error("Error fetching client modules during auth:", clientModulesError);
          if (dispatch) dispatch(setError(clientModulesError.message));
          return [];
        }

        // Convert client modules to the expected format and sort by order
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) return null;
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level, // Using level as key
            icon: moduleObj.icon || '',
            level: moduleObj.level, // Include the level property
            enabled: true,
            accessLevel: cm.access_level || {},
            order: moduleObj.order || 999, // Use order from modules table
            url: moduleObj.url || `/${moduleObj.name.toLowerCase().replace(/\s+/g, '-')}` // Use URL from modules table or generate from name
          };
        }).filter(Boolean) as Module[] || [];
        
      } else {
        // First fetch all client modules to understand what's available
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level, order, url)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error("Error fetching client modules for employee during auth:", clientModulesError);
          if (dispatch) dispatch(setError(clientModulesError.message));
          return [];
        }

        // Then fetch employee-specific module permissions
        const { data: employeeModules, error: employeeModulesError } = await supabase
          .from('employee_modules')
          .select(`
            module_id,
            level
          `)
          .eq('employee_id', employeeId);

        if (employeeModulesError) {
          console.error("Error fetching employee modules during auth:", employeeModulesError);
          if (dispatch) dispatch(setError(employeeModulesError.message));
          return [];
        }

        // Create a map of employee module permissions for quick lookup
        const employeeModuleMap = new Map();
        employeeModules?.forEach(em => {
          employeeModuleMap.set(em.module_id, em.level);
        });

        // Combine client modules with employee-specific permissions
        configuredModules = clientModules?.map(cm => {
          const moduleObj = cm.modules;
          if (!moduleObj) return null;
          
          // Check if this module is assigned to the employee
          const hasAccess = employeeModules?.some(em => em.module_id === moduleObj.id) || 
                           employeeModules?.length === 0; // If no modules specified, assume access to all
          
          if (!hasAccess && employeeModules?.length > 0) {
            return null;
          }
          
          return {
            id: moduleObj.id,
            name: moduleObj.name,
            key: moduleObj.level,
            icon: moduleObj.icon || '',
            level: moduleObj.level,
            enabled: true,
            accessLevel: employeeModuleMap.get(moduleObj.id) || cm.access_level || {},
            order: moduleObj.order || 999, // Use order from modules table
            url: moduleObj.url || `/${moduleObj.name.toLowerCase().replace(/\s+/g, '-')}` // Use URL from modules table or generate from name
          };
        }).filter(Boolean) as Module[] || [];
      }

      // Sort modules by order field (nulls last)
      configuredModules.sort((a, b) => {
        if (a.order === null || a.order === undefined) return 1;
        if (b.order === null || b.order === undefined) return -1;
        return a.order - b.order;
      });

      // If no modules found, provide a dashboard
      if (configuredModules.length === 0) {
        configuredModules = [{
          id: 'dashboard-default',
          name: 'Dashboard',
          key: 'dashboard',
          icon: 'LayoutDashboard',
          level: 'client',
          enabled: true,
          accessLevel: {},
          order: 1,
          url: '/dashboard'
        }];
      }
      
      return configuredModules;
      
    } catch (error) {
      console.error("Error in fetchConfiguredModules during auth:", error);
      return [];
    }
  }, [dispatch]);

  // Function to check if domain is allowed for a client
  const validateDomain = useCallback(async (email: string | undefined, clientId: string | null): Promise<boolean> => {
    if (!email || !clientId) return false;
    
    try {
      // Fetch allowed domains for the client
      const { data, error } = await supabase
        .from('clients')
        .select('allowed_domains, super_admin_allowed_domain')
        .eq('id', clientId)
        .single();
      
      if (error || !data) {
        console.error("Error fetching client domains:", error);
        return false;
      }
      
      // Extract domain from email
      const userDomain = extractDomain(email);
      if (!userDomain) return false;
      
      // Parse allowed domains string into array
      const allowedDomainsStr = data.allowed_domains || '';
      const allowedDomains = allowedDomainsStr
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
      
      // Check if domain is allowed
      return allowedDomains.includes(userDomain);
    } catch (error) {
      console.error("Error validating domain:", error);
      return false;
    }
  }, []);

  // Handle user authentication from various providers (Google, etc.) - MEMOIZED
  const handleUserAuthentication = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser || isProcessingAuth) {
      // If no user provided or already processing, return early
      if (!supabaseUser) {
        toast.error("Authentication failed. Please login again.");
        // Clear any existing auth data to ensure clean state
        setUser(null);
        setEmployeeData(null);
        saveEmployeeDataToStorage(null);
        setAuthError(null);
        
        // Clear Redux state if dispatch is available
        if (dispatch) {
          dispatch(resetEmployee());
        }
      }
      return;
    }
    
    try {
      setIsProcessingAuth(true);
      
      // STEP 1: Check if employee exists FIRST before proceeding
      if (!supabaseUser.email) {
        setAuthError("No email found in authentication data. Please contact support.");
        toast.error("No email found in authentication data. Please contact support.");
        
        // Sign out the user from Supabase since we can't proceed
        await supabase.auth.signOut();
        setIsProcessingAuth(false);
        return;
      }

      // STEP 2: Look for employee record by email (this is the gatekeeper)
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('employees')
        .select('id, client_id, employee_type, first_name, last_name, email, status, user_id, is_super_admin, department')
        .eq('email', supabaseUser.email.toLowerCase())
        .single();

      // STEP 3: If no employee record found, reject authentication immediately
      if (employeeError || !employeeRecord) {
        setAuthError("Your email is not registered as an employee. Please contact your administrator to register your account first.");
        toast.error("Your email is not registered as an employee. Please contact your administrator.");
        
        // Sign out the user from Supabase
        await supabase.auth.signOut();
        
        // Clear local state
        setUser(null);
        setEmployeeData(null);
        saveEmployeeDataToStorage(null);
        
        // Clear Redux state if dispatch is available
        if (dispatch) {
          dispatch(resetEmployee());
        }
        
        setIsProcessingAuth(false);
        
        // Force redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return;
      }

      // STEP 4: Check if employee is active
      if (employeeRecord.status !== true) {
        setAuthError("Your employee account has been deactivated. Please contact support.");
        toast.error("Your employee account has been deactivated. Please contact support.");
        await supabase.auth.signOut();
        setIsProcessingAuth(false);
        return;
      }

      // STEP 5: Validate domain for this client (unless super admin)
      if (!employeeRecord.is_super_admin) {
        const isDomainValid = await validateDomain(supabaseUser.email, employeeRecord.client_id);
        
        if (!isDomainValid) {
          setAuthError("Your email domain is not authorized for this application. Please contact an administrator.");
          toast.error("Your email domain is not authorized for this application.");
          
          // Sign out the user from Supabase
          await supabase.auth.signOut();
          
          // Clear local state
          setUser(null);
          setEmployeeData(null);
          saveEmployeeDataToStorage(null);
          
          // Clear Redux state if dispatch is available
          if (dispatch) {
            dispatch(resetEmployee());
          }
          
          setIsProcessingAuth(false);
          
          // Force redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return;
        }
      }

      // STEP 6: If employee exists and is valid, link user_id if not already linked
      if (!employeeRecord.user_id) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({ user_id: supabaseUser.id })
          .eq('id', employeeRecord.id);

        if (updateError) {
          console.error("Error linking user_id to employee:", updateError);
          setAuthError("Failed to link your account. Please contact support.");
          toast.error("Failed to link your account. Please contact support.");
          await supabase.auth.signOut();
          setIsProcessingAuth(false);
          return;
        }

        // Update the employee record with the new user_id for further processing
        employeeRecord.user_id = supabaseUser.id;
      }

      // STEP 7: Create user and employee data objects
      // Extract auth provider from user metadata or email
      let provider = (supabaseUser.app_metadata?.provider || 'email') as string;
      
      // If email is present but no provider is specified, assume direct sign-in
      if (supabaseUser.email && !provider) {
        provider = 'email';
      }
      
      // Construct a name from available information
      const name = supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 
                  'User';
      
      // Try to split the name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Convert employee_type string to UserRole
      let employeeRole: UserRole = 'user'; // Default role
      switch (employeeRecord.employee_type) {
        case 'admin':
          employeeRole = 'admin';
          break;
        case 'viewer':
          employeeRole = 'viewer';
          break;
        case 'reporter':
          employeeRole = 'reporter';
          break;
        case 'saas_owner':
          employeeRole = 'saas_owner';
          break;
        default:
          employeeRole = 'user';
      }

      // Fetch client and client type information
      const clientInfo = await fetchClientInfo(employeeRecord.client_id);

      const employeeData: EmployeeData = {
        id: employeeRecord.id,
        clientId: employeeRecord.client_id,
        firstName: employeeRecord.first_name,
        lastName: employeeRecord.last_name,
        email: employeeRecord.email,
        isSuperAdmin: employeeRecord.is_super_admin,
        department: employeeRecord.department,
        employeeType: employeeRecord.employee_type,
        client: clientInfo.client,
        clientType: clientInfo.clientType
      };
      
      // Create a new user object with client information
      const newUser: User = {
        id: supabaseUser.id,
        firstName,
        lastName,
        email: supabaseUser.email || '',
        role: employeeRole,
        isActive: true,
        provider,
        clientId: employeeRecord.client_id,
        createdAt: supabaseUser.created_at || new Date().toISOString(),
        department: employeeRecord.department as DepartmentType,
        employeeType: employeeRecord.employee_type as EmployeeType,
        isSuperAdmin: employeeRecord.is_super_admin,
        client: clientInfo.client,
        clientType: clientInfo.clientType
      };

      // STEP 8: Save the user to localStorage and context
      setUser(newUser);
      saveUserToStorage(newUser);
      
      // STEP 9: Fetch and store configured modules in Redux
      console.log('🔄 Loading configured modules for employee:', employeeRecord.id);
      const configuredModules = await fetchConfiguredModules(
        employeeRecord.id, 
        employeeRecord.client_id, 
        employeeRecord.is_super_admin
      );
      
      console.log('✅ Configured modules loaded:', configuredModules.length);
      
      // Store employee data in Redux
      if (dispatch) {
        dispatch({
          type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
          payload: employeeData
        });
        
        dispatch({
          type: EmployeeActionTypes.SET_CLIENT_ID,
          payload: employeeRecord.client_id
        });
        
        dispatch({
          type: EmployeeActionTypes.SET_CONFIGURED_MODULES,
          payload: configuredModules
        });
        
        // Save to sessionStorage for persistence
        saveAuthState({
          currentUser: newUser,
          isAuthenticated: true,
          isBackofficeUser: false,
          authError: null,
          employeeData,
          clientId: employeeRecord.client_id,
          configuredModules
        });
      }
      
      // Store employee data in auth context
      setEmployeeData(employeeData);
      saveEmployeeDataToStorage(employeeData);
      
      console.log('✅ SSO Authentication completed successfully for:', supabaseUser.email);
      
      // Clear any previous auth errors
      setAuthError(null);
      
    } catch (error) {
      console.error("Error in handleUserAuthentication:", error);
      setAuthError("Authentication failed. Please try again.");
      toast.error("Authentication failed. Please try again.");
      
      // Clear state on error
      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);
      
      if (dispatch) {
        dispatch(resetEmployee());
      }
    } finally {
      setIsProcessingAuth(false);
    }
  }, [
    isProcessingAuth,
    setUser,
    setEmployeeData,
    setAuthError,
    dispatch,
    fetchClientInfo,
    fetchConfiguredModules,
    validateDomain
  ]);

  return {
    handleUserAuthentication,
    isProcessingAuth
  };
};
