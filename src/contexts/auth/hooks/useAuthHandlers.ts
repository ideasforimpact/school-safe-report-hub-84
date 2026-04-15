import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData, Client, ClientType, ClientIntegration, DepartmentType, EmployeeType } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setConfiguredModules, setLoading, setError, resetEmployee, setClientId } from '@/store/employeeActions';
import { EmployeeActionTypes } from '@/store/types';
import { Module } from '@/store/types';
import { extractDomain, isEmailDomainAllowed } from '@/utils/authProviders';
import { NavigateFunction } from 'react-router-dom';

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

// Enhanced employee data interface that includes the new fields from the updated RPC function
interface EmployeeAuthRecord {
  id: string;
  email: string;
  client_id: string;
  user_id: string;
  status: boolean;
  first_name: string;
  last_name: string;
  employee_id: string;
  is_super_admin: boolean;
  department?: string;
  employee_type?: string;
}

// Interface for the link_user_to_employee function response
interface LinkUserResponse {
  success: boolean;
  error: string | null;
  employee_data: {
    id: string;
    clientId: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    isSuperAdmin: boolean;
    department?: string;
    employeeType?: string;
  } | null;
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
  navigate: NavigateFunction; // Add navigate function for proper routing
}

export const useAuthHandlers = ({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  setEmployeeData,
  dispatch,
  navigate
}: UseAuthHandlersProps) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Helper function to fetch client and client type information
  const fetchClientInfo = useCallback(async (clientId: string): Promise<{ client: Client | null, clientType: ClientType | null, clientIntegration: ClientIntegration[] | null }> => {
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
            console.log('✅ Client integration fetched in useAuthHandlers:', {
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

      const { data: aiFeatureResponse, error: aiFeatureError } = await supabase.functions.invoke('client-management', {
        body: { operation: 'get-ai-feature', client: { id: clientId } },
      });

      if (aiFeatureError) {
        console.warn('client-management get-ai-feature failed (useAuthHandlers):', aiFeatureError);
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
        incidentRecommendedActionsEnabled:
          aiFeatureError || aiFeatureResponse?.enabled === undefined
            ? true
            : aiFeatureResponse.enabled !== false,
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
    console.log("🔍 DOMAIN VALIDATION DEBUG - Starting validation:", { email, clientId });
    
    if (!email || !clientId) {
      console.log("❌ DOMAIN VALIDATION DEBUG - Missing email or clientId:", { email, clientId });
      return false;
    }
    
    try {
      // Use secure function to fetch client domains (bypasses RLS during login)
      const { data, error } = await supabase.rpc('get_client_domains', {
        p_client_id: clientId
      });
      
      console.log("📊 DOMAIN VALIDATION DEBUG - Client data fetched via secure function:", { data, error });
      
      if (error || !data) {
        console.error("❌ DOMAIN VALIDATION DEBUG - Error fetching client domains:", error);
        return false;
      }
      
      // Type assertion for the RPC response data
      const clientData = data as { 
        allowed_domains: string | null; 
        super_admin_allowed_domain: string | null; 
        active: boolean; 
      };
      
      // Check if client is active
      if (!clientData.active) {
        console.log("❌ DOMAIN VALIDATION DEBUG - Client is not active");
        return false;
      }
      
      // Extract domain from email
      const userDomain = extractDomain(email);
      console.log("🌐 DOMAIN VALIDATION DEBUG - User domain extracted:", { 
        email, 
        userDomain, 
        extractedBy: 'extractDomain function' 
      });
      
      if (!userDomain) {
        console.log("❌ DOMAIN VALIDATION DEBUG - No domain extracted from email");
        return false;
      }
      
      // Parse allowed domains string into array
      const allowedDomainsStr = clientData.allowed_domains || '';
      console.log("📝 DOMAIN VALIDATION DEBUG - Raw allowed domains string:", { allowedDomainsStr });
      
      const allowedDomains = allowedDomainsStr
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
      
      console.log("📋 DOMAIN VALIDATION DEBUG - Parsed allowed domains:", { 
        allowedDomains,
        allowedDomainsCount: allowedDomains.length 
      });
      
      // Check if domain is allowed
      const isAllowed = allowedDomains.includes(userDomain);
      
      console.log("🎯 DOMAIN VALIDATION DEBUG - Final comparison:", {
        userDomain,
        allowedDomains,
        isAllowed,
        exactMatch: allowedDomains.find(domain => domain === userDomain),
        caseInsensitiveCheck: allowedDomains.find(domain => domain.toLowerCase() === userDomain.toLowerCase())
      });
      
      return isAllowed;
    } catch (error) {
      console.error("💥 DOMAIN VALIDATION DEBUG - Exception in validateDomain:", error);
      return false;
    }
  }, []);

  // Enhanced function to link user_id to employee record using database function
  const linkUserToEmployee = useCallback(async (userId: string, email: string, retryCount = 0): Promise<LinkUserResponse> => {
    const maxRetries = 3;
    
    try {
      console.log(`Attempting to link user ID to employee record (attempt ${retryCount + 1}):`, { userId, email });
      
      // Use the new database function for transactional linking
      const { data, error } = await supabase.rpc('link_user_to_employee', {
        p_user_id: userId,
        p_employee_email: email.trim()
      });

      if (error) {
        console.error('Error calling link_user_to_employee function:', error);
        
        // Retry on certain types of errors
        if (retryCount < maxRetries && (
          error.code === 'PGRST301' || // Connection error
          error.code === 'PGRST116' || // Transaction error
          error.message?.includes('timeout')
        )) {
          console.log(`Retrying user linking (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return linkUserToEmployee(userId, email, retryCount + 1);
        }
        
        return { success: false, error: error.message, employee_data: null };
      }

      // Type assertion for the response data with proper unknown conversion
      const result = data as unknown as LinkUserResponse;
      
      if (!result?.success) {
        console.error('Failed to link user ID to employee:', result?.error);
        return result;
      }

      console.log('Successfully linked user ID to employee:', result.employee_data);
      return result;
    } catch (error) {
      console.error('Exception during user ID linking:', error);
      
      // Retry on exceptions
      if (retryCount < maxRetries) {
        console.log(`Retrying user linking after exception (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return linkUserToEmployee(userId, email, retryCount + 1);
      }
      
      return { success: false, error: `Exception during linking: ${error}`, employee_data: null };
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

      // STEP 2: Look for employee record by email using security definer function to bypass RLS
      const cleanedEmail = supabaseUser.email.trim().replace(/[\n\r\t]/g, '').toLowerCase();
      const { data: employeeRecords, error: employeeError } = await supabase
        .rpc('get_employee_by_email_for_auth', { user_email: cleanedEmail });

      // Extract the first (and should be only) employee record
      const employeeRecord = employeeRecords && employeeRecords.length > 0 ? employeeRecords[0] as EmployeeAuthRecord : null;

      // STEP 3: If no employee record found, reject authentication immediately
      if (employeeError || !employeeRecord) {
        console.log(employeeError,"employeeError");
        
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
        
        // Wait a moment for the user to see the error message, then redirect
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000); // 3 second delay to allow user to read the error
        
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
        console.log("🔐 AUTH DEBUG - Starting domain validation for non-super admin:", {
          userEmail: supabaseUser.email,
          employeeClientId: employeeRecord.client_id,
          employeeIsSuperAdmin: employeeRecord.is_super_admin
        });
        
        const isDomainValid = await validateDomain(supabaseUser.email, employeeRecord.client_id);
        
        console.log("✅ AUTH DEBUG - Domain validation result:", {
          isDomainValid,
          userEmail: supabaseUser.email,
          clientId: employeeRecord.client_id
        });
        
        if (!isDomainValid) {
          console.log("❌ AUTH DEBUG - Domain validation failed, blocking authentication");
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
          
          // Wait a moment for the user to see the error message, then redirect
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000); // 3 second delay to allow user to read the error
          
          return;
        }
        
        console.log("✅ AUTH DEBUG - Domain validation passed, continuing authentication");
      } else {
        console.log("👑 AUTH DEBUG - User is super admin, skipping domain validation");
      }

      // STEP 6: If employee exists and is valid, link user_id if not already linked
      if (!employeeRecord.user_id) {
        console.log("Employee record needs user_id linking:", { employeeId: employeeRecord.id, userEmail: supabaseUser.email });
        
        // Use the new enhanced linking function with retry logic
        const linkResult = await linkUserToEmployee(supabaseUser.id, supabaseUser.email);

        console.log(linkResult,"linkedREsult");
        
        
        if (!linkResult.success) {
          console.error("Failed to link user_id to employee:", linkResult.error);
          setAuthError(`Failed to link your account: ${linkResult.error}. Please contact support.`);
          toast.error("Failed to link your account. Please contact support.");
          await supabase.auth.signOut();
          setIsProcessingAuth(false);
          return;
        }

        // Update the employee record with the new user_id for further processing
        employeeRecord.user_id = supabaseUser.id;
        
        // Update other fields if they were returned from the linking function
        if (linkResult.employee_data) {
          employeeRecord.client_id = linkResult.employee_data.clientId;
          employeeRecord.first_name = linkResult.employee_data.firstName;
          employeeRecord.last_name = linkResult.employee_data.lastName;
          employeeRecord.employee_id = linkResult.employee_data.employeeId;
          employeeRecord.is_super_admin = linkResult.employee_data.isSuperAdmin;
          employeeRecord.department = linkResult.employee_data.department;
          employeeRecord.employee_type = linkResult.employee_data.employeeType;
        }
        
        console.log("Successfully linked user_id to employee record");
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
        clientType: clientInfo.clientType,
        client_integration: clientInfo.clientIntegration
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
      
      // Store employee data in Redux - MANUAL DISPATCH FORMAT
      if (dispatch) {
        dispatch({
          type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
          payload: employeeData
        });
        
        // Also set clientId in Redux
        if (employeeData.clientId) {
          dispatch(setClientId(employeeData.clientId));
        }
      }
      
      // FETCH MODULES HERE if employee is a super admin or has a client ID
      if (dispatch && employeeData.id && employeeData.clientId) {
        dispatch(setLoading(true));
        
        // Get configured modules based on super admin status
        const modules = await fetchConfiguredModules(
          employeeData.id, 
          employeeData.clientId,
          !!employeeData.isSuperAdmin
        );
        
        // Store modules in Redux
        dispatch(setConfiguredModules(modules));
        dispatch(setLoading(false));
      }
      
      // Also update context and localStorage for backward compatibility
      setEmployeeData(employeeData);
      saveEmployeeDataToStorage(employeeData);

      // Clear any auth errors
      setAuthError(null);
      
      // Mark auth initialization as complete
      authInitCompleteRef.current = true;
    } catch (error) {
      console.error('Authentication processing error:', error);
      setAuthError('Failed to process authentication');
      toast.error('Authentication failed. Please try again.');
      
      // Ensure user is logged out on error
      await supabase.auth.signOut();
      
      // Clear all local state
      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);
      
      // Clear Redux state if dispatch is available
      if (dispatch) {
        dispatch(resetEmployee());
      }
      
      // Wait a moment for the user to see the error message, then redirect
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000); // 3 second delay to allow user to read the error
    } finally {
      setIsProcessingAuth(false);
    }
  }, [isProcessingAuth, setAuthError, setUser, authInitCompleteRef, setEmployeeData, fetchConfiguredModules, dispatch, validateDomain, users, setUsers, fetchClientInfo, navigate]);

  return {
    handleUserAuthentication
  };
};
