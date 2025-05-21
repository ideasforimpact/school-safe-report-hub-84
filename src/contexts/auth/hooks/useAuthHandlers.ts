
import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setEmployeeData, setConfiguredModules, setLoading, setError } from '@/store/employeeActions';
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
  
  // New function to fetch configured modules for an employee
  const fetchConfiguredModules = useCallback(async (employeeId: string, clientId: string | null, isSuperAdmin: boolean) => {
    try {
      console.log("Fetching configured modules during authentication for", { employeeId, clientId, isSuperAdmin });
      
      if (!clientId) {
        console.error("Client ID is missing, cannot fetch modules");
        if (dispatch) dispatch(setError("Client ID is missing"));
        return [];
      }
      
      let configuredModules: Module[] = [];
      
      if (isSuperAdmin) {
        console.log("Fetching modules for super admin");
        // For super admins, fetch all modules enabled for the client
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);

        if (clientModulesError) {
          console.error("Error fetching client modules during auth:", clientModulesError);
          if (dispatch) dispatch(setError(clientModulesError.message));
          return [];
        }

        // Convert client modules to the expected format
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
            accessLevel: cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
        
      } else {
        console.log("Fetching modules for regular employee");
        // First fetch all client modules to understand what's available
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select(`
            id,
            module_id,
            enabled,
            access_level,
            modules(id, name, icon, level)
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
            access_level
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
          employeeModuleMap.set(em.module_id, em.access_level);
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
            accessLevel: employeeModuleMap.get(moduleObj.id) || cm.access_level || {}
          };
        }).filter(Boolean) as Module[] || [];
      }

      // If no modules found, provide a dashboard
      if (configuredModules.length === 0) {
        configuredModules = [{
          id: 'dashboard-default',
          name: 'Dashboard',
          key: 'dashboard',
          icon: 'LayoutDashboard',
          level: 'client',
          enabled: true,
          accessLevel: {}
        }];
      }
      
      // Only log the modules length since employeeModules might be undefined or out of scope here
      console.log("Modules fetched during auth:", configuredModules.length);
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

  // Handle user authentication from various providers (Google, etc.)
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
      }
      return;
    }
    
    try {
      setIsProcessingAuth(true);

      console.log("Processing authentication for user:", supabaseUser.email);
      
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
      
      // Now fetch the employee details from the employees table
      // to check if they exist and get their role if they do
      let employeeData = null;
      let employeeRole: UserRole = 'user'; // Default role
      let clientId = null;
      
      // First, try to find the employee by user ID if it exists
      if (supabaseUser.id) {
        const { data, error } = await supabase
          .from('employees')
          .select('id, client_id, employee_type, first_name, last_name, email, status, user_id, is_super_admin')
          .eq('user_id', supabaseUser.id)
          .single();
          
        if (!error && data) {
          employeeData = {
            id: data.id,
            clientId: data.client_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            isSuperAdmin: data.is_super_admin
          };
          
          // Convert employee_type string to UserRole
          switch (data.employee_type) {
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
          
          clientId = data.client_id;
          
          // Check if employee is inactive
          if (data.status !== true) {
            console.log("User account is inactive");
            setAuthError("Your account has been deactivated. Please contact support.");
            toast.error("Your account has been deactivated. Please contact support.");
            await supabase.auth.signOut();
            setIsProcessingAuth(false);
            return;
          }
          
          console.log("Found employee record by user_id:", employeeData);
        } else if (error) {
          console.log("Error finding employee by user_id:", error);
        }
      }
      
      // If not found by ID, try by email
      if (!employeeData && supabaseUser.email) {
        const { data, error } = await supabase
          .from('employees')
          .select('id, client_id, employee_type, first_name, last_name, email, status, user_id, is_super_admin')
          .eq('email', supabaseUser.email.toLowerCase())
          .single();
          
        if (!error && data) {
          employeeData = {
            id: data.id,
            clientId: data.client_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            isSuperAdmin: data.is_super_admin
          };
          
          // Convert employee_type string to UserRole
          switch (data.employee_type) {
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
          
          clientId = data.client_id;
          
          // Check if employee is inactive
          if (data.status !== true) {
            console.log("User account is inactive");
            setAuthError("Your account has been deactivated. Please contact support.");
            toast.error("Your account has been deactivated. Please contact support.");
            await supabase.auth.signOut();
            setIsProcessingAuth(false);
            return;
          }
          
          // Update the user_id in employees table if it's not set
          if (data.user_id !== supabaseUser.id) {
            await supabase
              .from('employees')
              .update({ user_id: supabaseUser.id })
              .eq('id', data.id);
          }
          
          console.log("Found employee record by email:", employeeData);
        } else if (error) {
          console.log("Error finding employee by email:", error);
        }
      }

      // If no employee record was found, alert the user and sign out
      if (!employeeData) {
        console.log("No employee record found for authenticated user");
        setAuthError("No employee record found for your account. Please contact an administrator.");
        toast.error("No employee record found for your account. Please contact an administrator.");
        await supabase.auth.signOut();
        setIsProcessingAuth(false);
        return;
      }
      
      // Check domain validation if we have an email and clientId
      if (supabaseUser.email && clientId) {
        const isDomainValid = await validateDomain(supabaseUser.email, clientId);
        
        if (!isDomainValid && !employeeData.isSuperAdmin) {
          console.log("User email domain not authorized for this client");
          setAuthError("Your email domain is not authorized for this application. Please contact an administrator.");
          toast.error("Your email domain is not authorized for this application.");
          await supabase.auth.signOut();
          setIsProcessingAuth(false);
          return;
        }
      }
      
      // Create a new user object
      const newUser: User = {
        id: supabaseUser.id,
        firstName,
        lastName,
        email: supabaseUser.email || '',
        role: employeeRole,
        isActive: true,
        provider,
        clientId,
        createdAt: supabaseUser.created_at || new Date().toISOString()
      };

      // Save the user to localStorage and context
      setUser(newUser);
      saveUserToStorage(newUser);
      
      // Save employee data to localStorage, context, and Redux
      if (employeeData) {
        console.log("Employee data being saved during auth:", employeeData);
        
        // Store employee data in Redux - CRITICAL FIX
        if (dispatch) {
          console.log("Dispatching setEmployeeData to Redux during auth:", employeeData);
          dispatch(setEmployeeData(employeeData));
        }
        
        // FETCH MODULES HERE if employee is a super admin or has a client ID
        if (dispatch && employeeData.id && employeeData.clientId) {
          console.log("Fetching modules during authentication process");
          dispatch(setLoading(true));
          
          // Get configured modules based on super admin status
          const modules = await fetchConfiguredModules(
            employeeData.id, 
            employeeData.clientId,
            !!employeeData.isSuperAdmin
          );
          
          // Store modules in Redux
          console.log("Storing modules in Redux during auth:", modules.length);
          dispatch(setConfiguredModules(modules));
          dispatch(setLoading(false));
        }
        
        // Also update context and localStorage for backward compatibility
        setEmployeeData(employeeData);
        saveEmployeeDataToStorage(employeeData);
      }

      // Clear any auth errors
      setAuthError(null);
      
      toast.success(`Welcome, ${firstName}!`);
      
      // Mark auth initialization as complete
      authInitCompleteRef.current = true;
    } catch (error) {
      console.error('Authentication processing error:', error);
      setAuthError('Failed to process authentication');
      toast.error('Authentication failed. Please try again.');
      // Ensure user is logged out on error
      await supabase.auth.signOut();
      setUser(null);
      setEmployeeData(null);
      saveEmployeeDataToStorage(null);
    } finally {
      setIsProcessingAuth(false);
    }
  }, [isProcessingAuth, setAuthError, setUser, authInitCompleteRef, setEmployeeData, fetchConfiguredModules, dispatch, validateDomain, users, setUsers]);

  return { handleUserAuthentication };
};
