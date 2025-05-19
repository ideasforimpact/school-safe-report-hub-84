
import { supabase } from '@/integrations/supabase/client';
import { User, UserWithPassword, EmployeeData, DepartmentType, EmployeeType } from '../types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Type for the useAuthHandlers hook props
interface AuthHandlersProps {
  user: User | null;
  users: UserWithPassword[];
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUsers: React.Dispatch<React.SetStateAction<UserWithPassword[]>>;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  setEmployeeData: React.Dispatch<React.SetStateAction<EmployeeData | null>>;
  setCachedModules: (backofficeModules: any[], clientModules: any[]) => void;
}

// Hook for handling authentication operations
export const useAuthHandlers = ({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  setEmployeeData,
  setCachedModules
}: AuthHandlersProps) => {
  
  // Function to handle login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check if auth is initialized
      if (!authInitCompleteRef.current) {
        console.warn("Auth initialization not complete yet, retrying login...");
        // Wait until auth init is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        return login(email, password);
      }
      
      // Try to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Supabase login error:", error.message);
        setAuthError(error.message);
        return false;
      }
      
      // Process the authentication if successful sign in
      if (data.user) {
        console.log("Login successful for:", data.user.email);
        await handleUserAuthentication(data.user);
        return true;
      }
      
      setAuthError("Login failed: User data not returned");
      return false;
    } catch (err) {
      const error = err as Error;
      console.error("Login error:", error.message);
      setAuthError(`Login error: ${error.message}`);
      return false;
    }
  };
  
  // Function to handle logout
  const logout = async () => {
    try {
      // Try to sign out with Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signout error:", error.message);
        setAuthError(error.message);
        return;
      }
      
      // Clear user state and redirect
      setUser(null);
      setEmployeeData(null);
      console.log("User logged out successfully");
      
      // Redirect to login or home page
      window.location.href = '/login';
    } catch (err) {
      const error = err as Error;
      console.error("Logout error:", error);
      setAuthError(`Logout error: ${error.message}`);
    }
  };
  
  // Function to handle user authentication
  const handleUserAuthentication = async (supabaseUser: any): Promise<void> => {
    try {
      // Authentication successful, record the user data
      console.log("Processing authentication for user:", supabaseUser.email);
      
      // Attempt to get the user metadata (if it exists)
      const userMetadata = supabaseUser.user_metadata || {};
      const providerData = userMetadata.provider || null;
      
      // Determine if this is a provider-authenticated user (Google, etc)
      const isProviderAuth = providerData || supabaseUser.app_metadata?.provider;
      console.log("Auth provider:", isProviderAuth || "email/password");
      
      // Find matching user in our application's users state or fetch from database
      let matchedUser = users.find((u) => u.email === supabaseUser.email);
      
      // If no matching user in state, try to get from database
      if (!matchedUser && isProviderAuth) {
        console.log("Provider authenticated user, checking employee data");
        
        try {
          // Check if there's an employee record with this email
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', supabaseUser.email)
            .single();
            
          if (employeeError) {
            console.error("Error fetching employee data:", employeeError);
          }
          
          if (employeeData) {
            console.log("Found employee record for provider auth:", employeeData.email);
            
            // Get employee's module permissions
            const { data: modulePermissionsData, error: permissionsError } = await supabase
              .from('employee_modules')
              .select('*')
              .eq('employee_id', employeeData.id)
              .maybeSingle();
              
            if (permissionsError) {
              console.error("Error fetching module permissions:", permissionsError);
            }
            
            // Transform database naming to frontend model naming
            const transformedEmployeeData: EmployeeData = {
              id: employeeData.id,
              clientId: employeeData.client_id,
              email: employeeData.email,
              firstName: employeeData.first_name,
              lastName: employeeData.last_name,
              department: employeeData.department as DepartmentType, // Cast to correct type
              employeeType: employeeData.employee_type as EmployeeType, // Cast to correct type
              status: employeeData.status,
              employeeId: employeeData.employee_id,
              isSuperAdmin: employeeData.is_super_admin
            };
            
            // Set the employee data for context
            setEmployeeData(transformedEmployeeData);
            
            // Default module permissions if none are found
            const modulePermissions = {
              superAdmin: employeeData.is_super_admin || false,
              incidentReporting: false,
              incidentAdmin: false, 
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: false,
              eduSafeResourceAccess: false
            };
            
            // Add module permissions if found
            if (modulePermissionsData && modulePermissionsData.access_level) {
              const accessLevel = modulePermissionsData.access_level as Record<string, any>;
              
              // Map database permission fields to frontend permission fields
              modulePermissions.superAdmin = accessLevel.isAdmin || employeeData.is_super_admin || false;
              modulePermissions.incidentReporting = accessLevel.incidentReporting || false;
              modulePermissions.incidentAdmin = accessLevel.incidentAdmin || false;
              modulePermissions.assessmentUser = accessLevel.assessmentUser || false;
              modulePermissions.assessmentsAdmin = accessLevel.assessmentsAdmin || false;
              modulePermissions.employeeVerificationAdmin = accessLevel.employeeVerificationAdmin || false;
              modulePermissions.grievancesAdmin = accessLevel.grievancesAdmin || false;
              modulePermissions.transportSafetyAdmin = accessLevel.transportSafetyAdmin || false;
              modulePermissions.eduSafeResourceAccess = accessLevel.eduSafeResourceAccess || false;
            }
            
            // Create a user object from the employee data
            const userFromEmployee: User = {
              id: employeeData.id,
              firstName: employeeData.first_name,
              lastName: employeeData.last_name,
              email: employeeData.email,
              role: modulePermissions.superAdmin ? 'admin' : 'reporter',
              clientId: employeeData.client_id,
              employeeId: employeeData.employee_id,
              isActive: typeof employeeData.status === 'boolean' ? employeeData.status : employeeData.status === 'active',
              createdAt: employeeData.created_at || new Date().toISOString(),
              provider: isProviderAuth,
              modulePermissions: modulePermissions
            };
            
            // Set the user in our app state
            setUser(userFromEmployee);
            matchedUser = userFromEmployee as UserWithPassword;
            
            // Pre-fetch module access to cache it immediately
            await fetchModulesForUser(employeeData.id, employeeData.client_id);
          } else {
            console.log("No employee record found for email:", supabaseUser.email);
            setAuthError("No account found for this email address");
          }
        } catch (err) {
          console.error("Error processing employee authentication:", err);
          setAuthError("Error processing authentication");
        }
      } else if (matchedUser) {
        console.log("Found matching user in application state:", matchedUser.email);
        
        // Update the user with provider information if applicable
        if (isProviderAuth) {
          matchedUser.provider = isProviderAuth;
        }
        
        // Set the user in our app state
        setUser(matchedUser);
      } else {
        console.error("No matching user found for:", supabaseUser.email);
        setAuthError("No account associated with this email");
      }
      
    } catch (err) {
      console.error("Error in handleUserAuthentication:", err);
      setAuthError("Failed to process authentication");
    }
  };
  
  // Function to fetch modules for a user directly during authentication
  const fetchModulesForUser = async (employeeId: string, clientId: string): Promise<void> => {
    try {
      console.log("Pre-fetching modules for employeeId:", employeeId, "clientId:", clientId);
      
      // First fetch client modules
      const { data: clientModulesData, error: clientError } = await supabase
        .from('client_modules')
        .select('*, modules(*)')
        .eq('client_id', clientId);
        
      if (clientError) {
        console.error("Error fetching client modules:", clientError);
        return;
      }
      
      // Now fetch backoffice modules (these are typically needed for admin users)
      const { data: backofficeModules, error: backofficeError } = await supabase
        .from('modules')
        .select('*')
        .eq('level', 'backoffice');
        
      if (backofficeError) {
        console.error("Error fetching backoffice modules:", backofficeError);
        return;
      }
      
      // Process client modules to include the module details
      const clientModules = clientModulesData?.map(clientModule => {
        // Extract the module data from the nested structure
        const moduleData = clientModule.modules;
        
        // Return combined data
        return {
          ...moduleData,
          access_level: clientModule.access_level,
          // Create a moduleKey from name by converting to lowercase and replacing spaces with underscores
          moduleKey: moduleData?.name?.toLowerCase().replace(/\s+/g, '_') || ''
        };
      });
      
      console.log(`Pre-fetched ${clientModules?.length || 0} client modules and ${backofficeModules?.length || 0} backoffice modules`);
      
      // Map the modules data to include the permission keys
      const mappedBackofficeModules = backofficeModules?.map(module => ({
        ...module,
        // Create a moduleKey from name by converting to lowercase and replacing spaces with underscores
        moduleKey: module.name?.toLowerCase().replace(/\s+/g, '_') || ''
      }));
      
      // Cache the modules in the context for immediate use
      setCachedModules(mappedBackofficeModules || [], clientModules || []);
      
    } catch (err) {
      console.error("Error pre-fetching modules:", err);
    }
  };
  
  // Functions for user management
  const addUser = (userData: any) => {
    setUsers(prevUsers => [...prevUsers, userData]);
    toast.success("User added successfully");
  };
  
  const updateUser = (id: string, updates: any) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === id ? { ...user, ...updates } : user))
    );
    toast.success("User updated successfully");
  };
  
  const deleteUser = (id: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    toast.success("User deleted successfully");
  };
  
  const deactivateUser = (id: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, isActive: false } : user
      )
    );
    toast.success("User deactivated successfully");
  };
  
  const reactivateUser = (id: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, isActive: true } : user
      )
    );
    toast.success("User reactivated successfully");
  };

  // Function to change user password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Try to update password with Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) {
        console.error("Password change error:", error.message);
        setAuthError(error.message);
        toast.error("Failed to change password");
        return false;
      }
      
      toast.success("Password changed successfully");
      return true;
    } catch (err) {
      const error = err as Error;
      console.error("Password change error:", error);
      setAuthError(`Password change error: ${error.message}`);
      toast.error("An error occurred while changing password");
      return false;
    }
  };

  return {
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changePassword,
    handleUserAuthentication
  };
};
