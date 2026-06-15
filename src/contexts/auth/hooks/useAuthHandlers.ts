import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData, Client, ClientType, ClientIntegration, DepartmentType, EmployeeType } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setConfiguredModules, setLoading, setError, resetEmployee, setClientId, setSwitchContext } from '@/store/employeeActions';
import { EmployeeActionTypes } from '@/store/types';
import { Module } from '@/store/types';
import { extractDomain, isEmailDomainAllowed } from '@/utils/authProviders';
import { NavigateFunction } from 'react-router-dom';

// Define the SupabaseUser type that's missing
export interface SupabaseUser {
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
export interface EmployeeAuthRecord {
  id: string;
  email: string;
  client_id: string;
  user_id: string;
  status: boolean;
  first_name: string;
  last_name: string;
  employee_id: string;
  is_super_admin: boolean;
  // Feature 2: marks rows added through the new multi-super-admin flow.
  // Optional because older clients of this type may not have set it; the
  // login path treats undefined as false.
  is_secondary_super_admin?: boolean;
  department?: string;
  employee_type?: string;
  // Extra display fields returned by get_employees_by_email_for_auth
  // (plural RPC). Used by the multi-client picker dialog.
  client_name?: string | null;
  client_logo?: string | null;
  client_active?: boolean | null;
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
  // Multi-client picker integration. When the SSO user resolves to more than
  // one active employees row, the hook stores both the rows and the live
  // Supabase user here and pauses; the dialog (ClientPickerDialog) later
  // calls completeAuthForEmployee with the selected row + the same Supabase
  // user to resume the flow.
  setPendingClientChoices?: (pending: PendingClientChoices | null) => void;
}

export interface PendingClientChoices {
  rows: EmployeeAuthRecord[];
  supabaseUser: SupabaseUser;
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
  navigate,
  setPendingClientChoices
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

      let incidentRecommendedActionsEnabled = true;
      const { data: aiFeatureResponse, error: aiFeatureError } = await supabase.functions.invoke(
        'client-management',
        { body: { operation: 'get-ai-feature', client: { id: clientId } } },
      );
      if (aiFeatureError) {
        console.warn('client-management get-ai-feature failed (useAuthHandlers):', aiFeatureError);
      } else if (aiFeatureResponse && typeof aiFeatureResponse.enabled === 'boolean') {
        incidentRecommendedActionsEnabled = aiFeatureResponse.enabled !== false;
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
        is_head_office: clientData.is_head_office === true,
        client_type: clientData.client_type,
        client_integration: clientIntegration,
        incidentRecommendedActionsEnabled,
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

  // Function to check if a user's email domain is in the client's allowed
  // domain list. The list to consult depends on whether the user is a
  // super admin: super admins are checked against
  // `super_admin_allowed_domain`, regular employees against
  // `allowed_domains`. Pre-Feature-4-bug-fix this function only ever
  // consulted `allowed_domains` AND the caller skipped it entirely for
  // super admins — so `super_admin_allowed_domain` was effectively
  // decorative. Now both fields are enforced symmetrically.
  const validateDomain = useCallback(async (
    email: string | undefined,
    clientId: string | null,
    isSuperAdmin: boolean,
  ): Promise<boolean> => {
    console.log("🔍 DOMAIN VALIDATION DEBUG - Starting validation:", { email, clientId, isSuperAdmin });

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

      // Pick the right domain list based on the caller's role. Super
      // admins go against super_admin_allowed_domain; everyone else goes
      // against allowed_domains. Both are stored as comma-separated text.
      const sourceField = isSuperAdmin
        ? 'super_admin_allowed_domain'
        : 'allowed_domains';
      const allowedDomainsStr = (isSuperAdmin
        ? clientData.super_admin_allowed_domain
        : clientData.allowed_domains) || '';

      console.log("📝 DOMAIN VALIDATION DEBUG - Raw allowed domains string:", {
        sourceField,
        allowedDomainsStr,
      });

      const allowedDomains = allowedDomainsStr
        .split(',')
        .map(domain => domain.trim().toLowerCase())
        .filter(domain => domain.length > 0);

      console.log("📋 DOMAIN VALIDATION DEBUG - Parsed allowed domains:", {
        sourceField,
        allowedDomains,
        allowedDomainsCount: allowedDomains.length
      });

      // Case-insensitive comparison so e.g. Gmail.com == gmail.com.
      const isAllowed = allowedDomains.includes(userDomain.toLowerCase());

      console.log("🎯 DOMAIN VALIDATION DEBUG - Final comparison:", {
        sourceField,
        userDomain,
        allowedDomains,
        isAllowed,
      });

      return isAllowed;
    } catch (error) {
      console.error("💥 DOMAIN VALIDATION DEBUG - Exception in validateDomain:", error);
      return false;
    }
  }, []);

  // Link an auth user_id to a specific employees row. Feature 3 switched
  // from the email-based link_user_to_employee RPC (which non-deterministically
  // picked the first unlinked row when multiple employees rows shared an
  // email — wrong for multi-client users) to the id-based
  // link_user_to_employee_by_id RPC (migration 20260612131000), which pins
  // down the exact row the picker chose. The caller now passes the
  // employees.id from the resolved (single-row OR picker-chosen) record.
  const linkUserToEmployee = useCallback(async (
    userId: string,
    employeeId: string,
    retryCount = 0,
  ): Promise<LinkUserResponse> => {
    const maxRetries = 3;

    try {
      console.log(`Attempting to link user ID to employee record (attempt ${retryCount + 1}):`, { userId, employeeId });

      const { data, error } = await supabase.rpc('link_user_to_employee_by_id', {
        p_user_id: userId,
        p_employee_id: employeeId,
      });

      if (error) {
        console.error('Error calling link_user_to_employee_by_id function:', error);

        if (retryCount < maxRetries && (
          error.code === 'PGRST301' ||
          error.code === 'PGRST116' ||
          error.message?.includes('timeout')
        )) {
          console.log(`Retrying user linking (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return linkUserToEmployee(userId, employeeId, retryCount + 1);
        }

        return { success: false, error: error.message, employee_data: null };
      }

      const result = data as unknown as LinkUserResponse;

      if (!result?.success) {
        console.error('Failed to link user ID to employee:', result?.error);
        return result;
      }

      console.log('Successfully linked user ID to employee:', result.employee_data);
      return result;
    } catch (error) {
      console.error('Exception during user ID linking:', error);

      if (retryCount < maxRetries) {
        console.log(`Retrying user linking after exception (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return linkUserToEmployee(userId, employeeId, retryCount + 1);
      }

      return { success: false, error: `Exception during linking: ${error}`, employee_data: null };
    }
  }, []);

  // Resume the auth flow for a specific employee row. Handles every step
  // that used to live inline in handleUserAuthentication after the RPC call:
  // status check, domain validation, user_id linking, building the User /
  // EmployeeData objects, Redux dispatch, localStorage persistence, modules
  // fetch. Invoked from two places:
  //   (a) the single-row path inside handleUserAuthentication, and
  //   (b) the multi-client picker dialog after the user chooses a client.
  const completeAuthForEmployee = useCallback(async (
    employeeRecord: EmployeeAuthRecord,
    supabaseUser: SupabaseUser
  ): Promise<void> => {
    try {
      setIsProcessingAuth(true);

      if (!supabaseUser.email) {
        setAuthError("No email found in authentication data. Please contact support.");
        toast.error("No email found in authentication data. Please contact support.");
        await supabase.auth.signOut();
        return;
      }

      // STEP 4: Check if employee is active
      if (employeeRecord.status !== true) {
        setAuthError("Your employee account has been deactivated. Please contact support.");
        toast.error("Your employee account has been deactivated. Please contact support.");
        await supabase.auth.signOut();
        return;
      }

      // STEP 5: Validate the user's email domain against the client's
      // configured allowed-domain list. Two lists exist:
      //   - super_admin_allowed_domain → checked when is_super_admin = true
      //   - allowed_domains            → checked when is_super_admin = false
      // Pre-fix the super-admin branch was skipped entirely, which left
      // super_admin_allowed_domain as effectively decorative. Now the
      // same enforcement applies symmetrically — a super admin (primary
      // OR secondary) whose email domain isn't in the client's
      // super_admin_allowed_domain list is rejected at login with a
      // clear error pointing at the Authentication tab.
      {
        console.log("🔐 AUTH DEBUG - Starting domain validation:", {
          userEmail: supabaseUser.email,
          employeeClientId: employeeRecord.client_id,
          employeeIsSuperAdmin: employeeRecord.is_super_admin,
        });

        const isDomainValid = await validateDomain(
          supabaseUser.email,
          employeeRecord.client_id,
          employeeRecord.is_super_admin === true,
        );

        console.log("✅ AUTH DEBUG - Domain validation result:", {
          isDomainValid,
          userEmail: supabaseUser.email,
          clientId: employeeRecord.client_id,
          isSuperAdmin: employeeRecord.is_super_admin,
        });

        if (!isDomainValid) {
          const domainListLabel = employeeRecord.is_super_admin
            ? 'Allowed Super Admin Email Domains'
            : 'Allowed Email Domains';
          const userDomain = supabaseUser.email?.split('@')[1] || 'your';
          const errorMsg = `The domain "${userDomain}" is not registered in this client's "${domainListLabel}" list. Please contact your administrator to add it.`;

          console.log("❌ AUTH DEBUG - Domain validation failed, blocking authentication", {
            userDomain,
            domainListLabel,
          });
          setAuthError(errorMsg);
          toast.error(errorMsg);

          await supabase.auth.signOut();

          setUser(null);
          setEmployeeData(null);
          saveEmployeeDataToStorage(null);

          if (dispatch) {
            dispatch(resetEmployee());
          }

          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);

          return;
        }

        console.log("✅ AUTH DEBUG - Domain validation passed, continuing authentication");
      }

      // STEP 6: Link user_id to the EXACT picked employees row if not yet
      // linked. The id-based RPC (Feature 3) eliminates the previous
      // email-based ambiguity that could stamp user_id onto the wrong
      // client's row.
      if (!employeeRecord.user_id) {
        console.log("Employee record needs user_id linking:", { employeeId: employeeRecord.id, userEmail: supabaseUser.email });

        const linkResult = await linkUserToEmployee(supabaseUser.id, employeeRecord.id);

        console.log(linkResult, "linkedREsult");

        if (!linkResult.success) {
          console.error("Failed to link user_id to employee:", linkResult.error);
          setAuthError(`Failed to link your account: ${linkResult.error}. Please contact support.`);
          toast.error("Failed to link your account. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        employeeRecord.user_id = supabaseUser.id;

        // The by-id RPC always returns the exact row we asked for, so the
        // identity check below is now a tautology — but keep it as defensive
        // wiring in case the RPC ever changes contract.
        if (linkResult.employee_data && linkResult.employee_data.id === employeeRecord.id) {
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

      // STEP 6.5 (Feature 3): stamp the picked client_id + employee_id into
      // auth.users.raw_app_meta_data via set_active_client_for_login, then
      // refresh the Supabase session so the new JWT (with the new
      // app_metadata claims) becomes the active access token. Every RLS
      // helper (get_current_user_client_id / get_current_user_employee_id)
      // reads from these JWT claims first — without this step the very
      // next RLS-aware request (fetchClientInfo below, configured-modules
      // fetch later) would either 21000 or silently scope to the wrong
      // client because the DB has no way to know which of the user's
      // multiple employees rows is "current".
      try {
        const { data: stampData, error: stampError } = await supabase.rpc(
          'set_active_client_for_login',
          {
            p_employee_id: employeeRecord.id,
            p_client_id: employeeRecord.client_id,
          },
        );
        const stampResult = stampData as { success?: boolean; error?: string } | null;
        if (stampError || !stampResult?.success) {
          const errMsg = stampError?.message || stampResult?.error || 'unknown error';
          console.error('Failed to stamp active client into app_metadata:', errMsg);
          setAuthError(`Failed to activate your client context: ${errMsg}. Please contact support.`);
          toast.error('Failed to activate your client context. Please log in again.');
          await supabase.auth.signOut();
          return;
        }

        // Mint a fresh JWT that carries the new app_metadata claims. The
        // SDK swaps tokens transparently; subsequent supabase.from(...)
        // requests pick up the new client_id automatically.
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Failed to refresh session after stamping app_metadata:', refreshError);
          setAuthError(`Failed to refresh your session: ${refreshError.message}. Please log in again.`);
          toast.error('Failed to refresh your session. Please log in again.');
          await supabase.auth.signOut();
          return;
        }
        console.log('✅ AUTH DEBUG - app_metadata stamped + session refreshed', {
          client_id: employeeRecord.client_id,
          employee_id: employeeRecord.id,
        });
      } catch (stampEx) {
        console.error('Exception during client-context stamping:', stampEx);
        setAuthError('Failed to activate your client context. Please log in again.');
        toast.error('Failed to activate your client context. Please log in again.');
        await supabase.auth.signOut();
        return;
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

      const clientInfo = await fetchClientInfo(employeeRecord.client_id);

      const employeeData: EmployeeData = {
        id: employeeRecord.id,
        clientId: employeeRecord.client_id,
        homeClientId: employeeRecord.client_id,
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

      if (dispatch) {
        dispatch({
          type: EmployeeActionTypes.SET_EMPLOYEE_DATA,
          payload: employeeData
        });

        if (employeeData.clientId) {
          dispatch(setClientId(employeeData.clientId));
          dispatch(setSwitchContext({
            homeClientId: employeeData.clientId,
            activeClientId: employeeData.clientId,
            isSwitchedContext: false,
            clientManagementReadOnly: false,
            switchedAccessLevel: 'W/R',
          }));
        }
      }

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

      setEmployeeData(employeeData);
      saveEmployeeDataToStorage(employeeData);

      setAuthError(null);

      authInitCompleteRef.current = true;
    } catch (error) {
      console.error('Authentication processing error:', error);
      setAuthError('Failed to process authentication');
      toast.error('Authentication failed. Please try again.');

      await supabase.auth.signOut();

      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);

      if (dispatch) {
        dispatch(resetEmployee());
      }

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } finally {
      setIsProcessingAuth(false);
    }
  }, [setAuthError, setUser, authInitCompleteRef, setEmployeeData, fetchConfiguredModules, dispatch, validateDomain, fetchClientInfo, navigate, linkUserToEmployee]);

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

      // STEP 2: Look up ALL active employee rows for this email via the new
      // plural security-definer RPC. The old singular function is still in
      // place but unused — keeping it lets us roll back instantly if needed.
      const cleanedEmail = supabaseUser.email.trim().replace(/[\n\r\t]/g, '').toLowerCase();
      const { data: employeeRecords, error: employeeError } = await supabase
        .rpc('get_employees_by_email_for_auth', { user_email: cleanedEmail });

      const rows = (employeeRecords || []) as EmployeeAuthRecord[];

      // STEP 3: If no employee record found, reject authentication immediately
      if (employeeError || rows.length === 0) {
        console.log(employeeError, "employeeError");

        setAuthError("Your email is not registered as an employee. Please contact your administrator to register your account first.");
        toast.error("Your email is not registered as an employee. Please contact your administrator.");

        await supabase.auth.signOut();

        setUser(null);
        setEmployeeData(null);
        saveEmployeeDataToStorage(null);

        if (dispatch) {
          dispatch(resetEmployee());
        }

        setIsProcessingAuth(false);

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);

        return;
      }

      // Multi-client picker gate. Only Google / Azure SSO logins trigger the
      // picker — email/password and single-row cases keep their existing
      // first-row-wins behavior. We also only show the picker when the
      // AuthProvider has wired setPendingClientChoices in; otherwise we
      // fall back to single-row behavior so the hook stays standalone.
      const provider = (supabaseUser.app_metadata?.provider || 'email') as string;
      const ssoProvider = provider === 'google' || provider === 'azure';

      if (rows.length > 1 && ssoProvider && setPendingClientChoices) {
        // Pause the flow. We deliberately do not setUser, dispatch any Redux
        // state, write localStorage, or navigate — route guards keep the app
        // gated on currentUser, so the dashboard shell can't render
        // anything authenticated until the user picks a client. The dialog
        // (mounted at the AuthProvider root) drives the next step.
        console.log('🪟 AUTH: Multi-client SSO login detected, opening client picker', {
          email: cleanedEmail,
          provider,
          choices: rows.length,
        });
        setPendingClientChoices({ rows, supabaseUser });
        setIsProcessingAuth(false);
        return;
      }

      // Single-row path (or multi-row from a non-SSO provider): take the
      // first row to preserve the original LIMIT-1 semantics exactly.
      await completeAuthForEmployee(rows[0], supabaseUser);
    } catch (error) {
      console.error('Authentication processing error:', error);
      setAuthError('Failed to process authentication');
      toast.error('Authentication failed. Please try again.');

      await supabase.auth.signOut();

      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);

      if (dispatch) {
        dispatch(resetEmployee());
      }

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

      setIsProcessingAuth(false);
    }
  }, [isProcessingAuth, setAuthError, setUser, setEmployeeData, dispatch, navigate, completeAuthForEmployee, setPendingClientChoices]);

  return {
    handleUserAuthentication,
    completeAuthForEmployee
  };
};
