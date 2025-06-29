import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData, Client, ClientType, DepartmentType, EmployeeType } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setConfiguredModules, setLoading, setError, resetEmployee, setClientId } from '@/store/employeeActions';
import { EmployeeActionTypes } from '@/store/types';
import { Module } from '@/store/types';
import { extractDomain, isEmailDomainAllowed } from '@/utils/authProviders';

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

  // Helper function to fetch backoffice modules
  const fetchBackofficeModules = useCallback(async () => {
    try {
      console.log('🔄 useAuthHandlers: Fetching backoffice modules');
      
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
        console.log('⚠️ useAuthHandlers: No backoffice modules found, using default modules');
        return [
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
      }

      console.log('✅ useAuthHandlers: Fetched modules:', modules);

      // Convert modules to the format expected by the application
      const formattedModules = modules.map(module => ({
        id: module.id,
        name: module.name,
        key: module.name.toLowerCase().replace(/\s+/g, '_'),
        icon: module.icon || 'Settings',
        level: 'admin',
        enabled: module.active,
        accessLevel: {},
        order: module.order || 999,
        url: module.url || `/${module.name.toLowerCase().replace(/\s+/g, '-')}`
      }));

      console.log('🔄 useAuthHandlers: Formatted modules:', formattedModules);
      return formattedModules;
    } catch (error) {
      console.error('Error in fetchBackofficeModules:', error);
      return [];
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

  // Handle user authentication from various sources (SSO, backoffice) - ENHANCED WITH BACKOFFICE SUPPORT
  const handleUserAuthentication = useCallback(async (
    supabaseUser: SupabaseUser | null, 
    isBackofficeAuth: boolean = false,
    backofficeUserData?: any
  ) => {
    if (isProcessingAuth) {
      console.log('🔄 useAuthHandlers: Already processing auth, skipping...');
      return;
    }
    
    try {
      setIsProcessingAuth(true);
      console.log('🔄 useAuthHandlers: Starting authentication process', { isBackofficeAuth, hasSupabaseUser: !!supabaseUser });
      
      // HANDLE BACKOFFICE AUTHENTICATION
      if (isBackofficeAuth && backofficeUserData) {
        console.log('🏢 useAuthHandlers: Processing backoffice authentication');
        
        // Create backoffice user object
        const backofficeUser: User = {
          id: backofficeUserData.id,
          firstName: 'Backoffice',
          lastName: 'Admin',
          email: backofficeUserData.email,
          role: 'saas_owner' as UserRole,
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
          createdAt: backofficeUserData.created_at,
          client: null,
          clientType: null
        };
        
        console.log('✅ useAuthHandlers: Created backoffice user:', backofficeUser);
        
        // Set user in context and localStorage
        setUser(backofficeUser);
        saveUserToStorage(backofficeUser);
        
        // Create backoffice employee data
        const backofficeEmployeeData: EmployeeData = {
          id: backofficeUserData.id,
          clientId: null,
          email: backofficeUserData.email,
          firstName: 'Backoffice',
          lastName: 'Admin',
          isSuperAdmin: true,
          department: 'Management',
          employeeType: 'admin',
          client: null,
          clientType: null
        };
        
        console.log('✅ useAuthHandlers: Created backoffice employee data:', backofficeEmployeeData);
        
        // Store employee data in Redux and context
        if (dispatch) {
          dispatch({
            type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
            payload: backofficeEmployeeData
          });
        }
        setEmployeeData(backofficeEmployeeData);
        saveEmployeeDataToStorage(backofficeEmployeeData);
        
        // Fetch and set backoffice modules
        if (dispatch) {
          dispatch(setLoading(true));
          const backofficeModules = await fetchBackofficeModules();
          console.log('✅ useAuthHandlers: Setting backoffice modules:', backofficeModules);
          dispatch(setConfiguredModules(backofficeModules));
          dispatch(setLoading(false));
        }
        
        // Clear any auth errors
        setAuthError(null);
        authInitCompleteRef.current = true;
        
        console.log('✅ useAuthHandlers: Backoffice authentication completed successfully');
        return;
      }
      
      // HANDLE SSO/REGULAR AUTHENTICATION (existing logic)
      if (!supabaseUser) {
        toast.error("Authentication failed. Please login again.");
        setUser(null);
        setEmployeeData(null);
        saveEmployeeDataToStorage(null);
        setAuthError(null);
        
        if (dispatch) {
          dispatch(resetEmployee());
        }
        return;
      }

      // STEP 1: Check if employee exists FIRST before proceeding
      if (!supabaseUser.email) {
        setAuthError("No email found in authentication data. Please contact support.");
        toast.error("No email found in authentication data. Please contact support.");
        
        // Sign out the user from Supabase since we can't proceed
        await supabase.auth.signOut();
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
        
        await supabase.auth.signOut();
        setUser(null);
        setEmployeeData(null);
        saveEmployeeDataToStorage(null);
        
        if (dispatch) {
          dispatch(resetEmployee());
        }
        
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
        return;
      }

      // STEP 5: Validate domain for this client (unless super admin)
      if (!employeeRecord.is_super_admin) {
        const isDomainValid = await validateDomain(supabaseUser.email, employeeRecord.client_id);
        
        if (!isDomainValid) {
          setAuthError("Your email domain is not authorized for this application. Please contact an administrator.");
          toast.error("Your email domain is not authorized for this application.");
          
          await supabase.auth.signOut();
          setUser(null);
          setEmployeeData(null);
          saveEmployeeDataToStorage(null);
          
          if (dispatch) {
            dispatch(resetEmployee());
          }
          
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
          return;
        }

        employeeRecord.user_id = supabaseUser.id;
      }

      // STEP 7: Create user and employee data objects
      let provider = (supabaseUser.app_metadata?.provider || 'email') as string;
      
      if (supabaseUser.email && !provider) {
        provider = 'email';
      }
      
      const name = supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 
                  'User';
      
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      let employeeRole: UserRole = 'user';
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
      
      // Store employee data in Redux
      if (dispatch) {
        dispatch({
          type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
          payload: employeeData
        });
        
        if (employeeData.clientId) {
          dispatch(setClientId(employeeData.clientId));
        }
      }
      
      // FETCH MODULES HERE if employee is a super admin or has a client ID
      if (dispatch && employeeData.id && employeeData.clientId) {
        dispatch(setLoading(true));
        
        const modules = await fetchConfiguredModules(
          employeeData.id, 
          employeeData.clientId,
          !!employeeData.isSuperAdmin
        );
        
        dispatch(setConfiguredModules(modules));
        dispatch(setLoading(false));
      }
      
      // Also update context and localStorage for backward compatibility
      setEmployeeData(employeeData);
      saveEmployeeDataToStorage(employeeData);

      // Clear any auth errors
      setAuthError(null);
      authInitCompleteRef.current = true;
      
    } catch (error) {
      console.error('Authentication processing error:', error);
      setAuthError('Failed to process authentication');
      toast.error('Authentication failed. Please try again.');
      
      // Ensure user is logged out on error
      if (!isBackofficeAuth) {
        await supabase.auth.signOut();
      }
      
      // Clear all local state
      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);
      
      if (dispatch) {
        dispatch(resetEmployee());
      }
      
      // Force redirect to login page on error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } finally {
      setIsProcessingAuth(false);
    }
  }, [isProcessingAuth, setAuthError, setUser, authInitCompleteRef, setEmployeeData, fetchConfiguredModules, dispatch, validateDomain, users, setUsers, fetchClientInfo, fetchBackofficeModules]);

  return {
    handleUserAuthentication
  };
};
