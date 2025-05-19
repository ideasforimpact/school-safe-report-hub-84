import { supabase } from '@/integrations/supabase/client';
import { User, UserWithPassword } from '@/contexts/auth/types';
import { toast } from 'sonner';
import { getUsersFromStorage, saveUserToStorage, saveUsersToStorage } from '@/services/auth/authService';

interface UseAuthHandlersProps {
  user: User | null;
  users: UserWithPassword[];
  setUser: (user: User | null) => void;
  setUsers: (users: UserWithPassword[]) => void;
  setAuthError: (error: string | null) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  isEmailDomainAllowed: (email: string, clientId: string) => boolean;
}

export const useAuthHandlers = ({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  isEmailDomainAllowed,
}: UseAuthHandlersProps) => {
  // Convert Supabase user to our User format
  const mapSupabaseUser = async (authUser: any): Promise<User> => {
    // Extract provider from identities array if exists
    let provider = 'email';
    if (authUser.identities && authUser.identities.length > 0) {
      provider = authUser.identities[0].provider || 'email';
    }
    
    try {
      // Try to fetch employee data for this user first
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (employeeError) {
        console.error("Error fetching employee data:", employeeError);
      }

      // If employee data exists, use it to enhance our user object
      if (employeeData) {
        console.log("Found employee data:", employeeData);
        return {
          id: authUser.id,
          email: authUser.email,
          firstName: employeeData.first_name || authUser.user_metadata?.first_name || '',
          lastName: employeeData.last_name || authUser.user_metadata?.last_name || '',
          role: employeeData.is_super_admin ? 'admin' : 'user',
          isActive: employeeData.status,
          clientId: employeeData.client_id,
          modulePermissions: {
            superAdmin: employeeData.is_super_admin,
          },
          provider // Add the provider to track auth method
        };
      }

      // If no employee data, create basic user from Supabase auth
      return {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.user_metadata?.first_name || '',
        lastName: authUser.user_metadata?.last_name || '',
        role: authUser.user_metadata?.role || 'user',
        isActive: true,
        provider // Add the provider to track auth method
      };
    } catch (error) {
      console.error("Error mapping user:", error);
      
      // Return basic user info if mapping fails
      return {
        id: authUser.id,
        email: authUser.email,
        isActive: true,
        provider // Always include provider
      };
    }
  };

  // Handle Supabase user authentication (login, signup, etc.)
  const handleUserAuthentication = async (authUser: any): Promise<void> => {
    if (!authUser) {
      setUser(null);
      setAuthError(null);
      return;
    }

    try {
      console.log("Processing authenticated user:", authUser.email);
      
      // Map Supabase user to our User format
      const mappedUser = await mapSupabaseUser(authUser);
      
      // For users authenticated via Google or other OAuth providers,
      // fetch their configured modules
      if (mappedUser.provider && mappedUser.provider !== 'email' && mappedUser.clientId) {
        // Try to fetch client modules
        console.log(`Fetching modules for ${mappedUser.provider} user with client ${mappedUser.clientId}`);
        try {
          const { data: clientModules, error: clientError } = await supabase
            .from('client_modules')
            .select('module_id, access_level')
            .eq('client_id', mappedUser.clientId);
            
          if (clientError) throw clientError;
          
          if (clientModules && clientModules.length > 0) {
            const moduleIds = clientModules.map(cm => cm.module_id);
            
            // Fetch the actual module details
            const { data: moduleDetails, error: modulesError } = await supabase
              .from('modules')
              .select('*')
              .in('id', moduleIds);
              
            if (modulesError) throw modulesError;
            
            if (moduleDetails && moduleDetails.length > 0) {
              // Combine module details with access levels
              const configuredModules = moduleDetails.map(module => {
                const clientModule = clientModules.find(cm => cm.module_id === module.id);
                return {
                  ...module,
                  access_level: clientModule?.access_level || { isEnabled: true }
                };
              });
              
              // Add modules to the user object
              mappedUser.modules = configuredModules;
              console.log(`Added ${configuredModules.length} configured modules to user`);
            }
          }
        } catch (error) {
          console.error("Error fetching user modules:", error);
        }
      }
      
      // Set the user in state and storage
      setUser(mappedUser);
      saveUserToStorage(mappedUser);
      console.log("User authenticated successfully:", mappedUser.email);
      
      // Clear any auth errors on successful authentication
      setAuthError(null);
    } catch (error) {
      console.error("Error handling user authentication:", error);
      setAuthError("Authentication error");
      setUser(null);
    } finally {
      // Set initialization complete flag
      authInitCompleteRef.current = true;
      
      // Update loading state managed elsewhere
      setIsLoading(false);
    }
  };

  // Login with email/password (mock implementation)
  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      console.log(`Attempting login for ${email}`);
      
      // Attempt Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        setAuthError(error.message);
        return false;
      }
      
      if (!data.user) {
        console.error("No user returned from login");
        setAuthError("Login failed");
        return false;
      }
      
      // This will be handled by the onAuthStateChange listener
      console.log("Login successful for", email);
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Login failed");
      return false;
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      
      // Clear user and reset error state
      setUser(null);
      setAuthError(null);
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error: any) {
      console.error("Error during logout:", error);
      setAuthError(error.message || "Logout failed");
    }
  };

  // Helper function to set loading state
  const setIsLoading = (state: boolean) => {
    // This is a placeholder - in the actual implementation, 
    // this would be connected to the loading state provided by props
    console.log("Setting isLoading:", state);
  };

  // Add a new user
  const addUser = async (userData: Omit<UserWithPassword, 'id'>): Promise<void> => {
    try {
      // Generate a unique ID for the new user
      const newUserId = `user_${Date.now()}`;
      
      // Create the new user object
      const newUser: UserWithPassword = {
        id: newUserId,
        ...userData,
        isActive: true
      };
      
      // Add the new user to the users array
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      console.log(`Added new user: ${userData.email}`);
    } catch (error) {
      console.error("Error adding user:", error);
      throw new Error("Failed to add user");
    }
  };

  // Update existing user
  const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
      // Find the user to update
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Update the user
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        ...userData
      };
      
      // Update state and storage
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      // If the updated user is the current user, update the current user state
      if (user && user.id === userId) {
        const { password, ...userWithoutPassword } = updatedUsers[userIndex];
        setUser({
          ...user,
          ...userWithoutPassword
        });
      }
      
      console.log(`Updated user: ${userId}`);
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  };

  // Delete user
  const deleteUser = async (userId: string): Promise<void> => {
    try {
      // Filter out the user to delete
      const updatedUsers = users.filter(u => u.id !== userId);
      
      // Update state and storage
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      console.log(`Deleted user: ${userId}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  };

  // Deactivate user
  const deactivateUser = async (userId: string): Promise<void> => {
    try {
      // Find the user to deactivate
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Deactivate the user
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive: false
      };
      
      // Update state and storage
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      console.log(`Deactivated user: ${userId}`);
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw new Error("Failed to deactivate user");
    }
  };

  // Reactivate user
  const reactivateUser = async (userId: string): Promise<void> => {
    try {
      // Find the user to reactivate
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Reactivate the user
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive: true
      };
      
      // Update state and storage
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      console.log(`Reactivated user: ${userId}`);
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw new Error("Failed to reactivate user");
    }
  };

  // Change user password
  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Using Supabase to update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        console.error("Password change error:", error);
        toast.error("Failed to change password");
        return false;
      }
      
      toast.success("Password updated successfully");
      return true;
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("Failed to change password");
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
    changeUserPassword,
    handleUserAuthentication,
  };
};
