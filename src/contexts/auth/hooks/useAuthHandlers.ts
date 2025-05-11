import { User, UserWithPassword } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  loginUser, 
  saveUserToStorage,
  changeUserPassword as changePassword
} from '@/services/auth/authService';
import { 
  addNewUser, 
  updateExistingUser, 
  deleteExistingUser, 
  deactivateExistingUser 
} from '@/services/auth/userManagementService';
import { excludePasswordFromUser } from '../utils';
import { checkEmployeeAccess } from './useEmployeeAccess';

// List of demo emails that can bypass the employee verification
const DEMO_EMAILS = [
  'owner@saasplatform.com',
  'admin@school.edu',
  'reporter@school.edu'
];

/**
 * Hook for auth operation handlers
 */
export function useAuthHandlers({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  isEmailDomainAllowed
}: {
  user: User | null;
  users: UserWithPassword[];
  setUser: (user: User | null) => void;
  setUsers: (users: UserWithPassword[]) => void;
  setAuthError: (error: string | null) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean;
}) {
  const navigate = useNavigate();

  const handleUserAuthentication = async (supabaseUser: any) => {
    // Clear any previous auth errors first
    setAuthError(null);
    
    // Check if user exists in our system
    console.log("Handling authentication for:", supabaseUser.email);
    
    // Check if this is a demo user - if so, bypass employee access check
    const isDemoUser = DEMO_EMAILS.includes(supabaseUser.email);
    
    // Only check employee access if not a demo user
    if (!isDemoUser) {
      const hasAccess = await checkEmployeeAccess(supabaseUser.email, setAuthError);
      if (!hasAccess) {
        console.log("Access denied: User is not an admin employee");
        await supabase.auth.signOut();
        toast.error("Access denied: Only admin department employees can login");
        navigate('/login');
        return;
      }
    }
    
    let existingUser = users.find(u => u.email.toLowerCase() === supabaseUser.email.toLowerCase());
    let isNewUser = false;
    
    if (existingUser) {
      console.log("User found in our system:", existingUser.firstName);
      // Update login timestamp
      const updatedUser = {
        ...existingUser,
        lastLogin: new Date().toISOString()
      };
      
      // For demo users, ensure they have full admin access
      if (isDemoUser) {
        updatedUser.role = 'admin';
        updatedUser.modulePermissions = {
          superAdmin: true,
          incidentReporting: true,
          incidentAdmin: true,
          assessmentUser: true,
          assessmentsAdmin: true,
          employeeVerificationAdmin: true,
          grievancesAdmin: true,
          transportSafetyAdmin: true,
          eduSafeResourceAccess: true
        };
      }
      
      const updatedUsers = users.map(u => 
        u.id === existingUser?.id ? { ...u, 
          lastLogin: new Date().toISOString(),
          ...(isDemoUser ? { 
            role: 'admin',
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
            }
          } : {})
        } : u
      );
      
      setUsers(updatedUsers);
      setUser(excludePasswordFromUser(updatedUser));
      saveUserToStorage(excludePasswordFromUser(updatedUser));
      console.log("User session updated");
    } else {
      console.log("New user via SSO, creating account");
      // For new users via SSO, create a basic account
      const firstName = supabaseUser.user_metadata?.name?.split(' ')?.[0] || 
                      supabaseUser.user_metadata?.full_name?.split(' ')?.[0] || 
                      'New';
      const lastName = supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                    supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                    'User';
      
      console.log("Creating with name:", firstName, lastName);
      isNewUser = true;
      
      // Determine if this is a demo user being created
      const isNewDemoUser = DEMO_EMAILS.includes(supabaseUser.email);
      
      const newUser: UserWithPassword = {
        id: supabaseUser.id,
        firstName,
        lastName,
        email: supabaseUser.email || '',
        password: '', // SSO users don't need passwords in our system
        role: isNewDemoUser ? 'admin' : 'admin', // Assign admin role since they've passed the employee check
        modulePermissions: isNewDemoUser ? {
          // Full access for demo users
          superAdmin: true,
          incidentReporting: true,
          incidentAdmin: true,
          assessmentUser: true,
          assessmentsAdmin: true,
          employeeVerificationAdmin: true,
          grievancesAdmin: true,
          transportSafetyAdmin: true,
          eduSafeResourceAccess: true
        } : {
          // Standard permissions for regular new users
          superAdmin: false,
          incidentReporting: true,
          incidentAdmin: false,
          assessmentUser: false,
          assessmentsAdmin: false,
          employeeVerificationAdmin: false,
          grievancesAdmin: false,
          transportSafetyAdmin: false,
          eduSafeResourceAccess: false
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setUser(excludePasswordFromUser(newUser));
      saveUserToStorage(excludePasswordFromUser(newUser));
      console.log("New user account created");
    }
    
    // If login was successful and we got here, clear any auth errors
    setAuthError(null);
    
    // Only show welcome toast if the authentication initialization hasn't completed yet
    // Using a ref to guarantee we only show the toast once per session
    if (!authInitCompleteRef.current) {
      if (isNewUser) {
        toast.success(`Welcome, ${existingUser?.firstName || supabaseUser.user_metadata?.name?.split(' ')?.[0] || 'New User'}!`);
      } else {
        toast.success(`Welcome back, ${existingUser?.firstName || supabaseUser.user_metadata?.name?.split(' ')?.[0] || 'User'}!`);
      }
      
      // Mark auth as complete to prevent duplicate toasts
      authInitCompleteRef.current = true;
    }
    
    // Redirect to dashboard on successful login
    navigate('/dashboard');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Login attempt:", email, password);
    
    try {
      // Check if this is a demo user - if so, bypass employee access check
      const isDemoUser = DEMO_EMAILS.includes(email);
      
      // Only check employee access if not a demo user
      if (!isDemoUser) {
        const hasAccess = await checkEmployeeAccess(email, setAuthError);
        if (!hasAccess) {
          console.log("Access denied: User is not an admin employee");
          setAuthError("Access denied: Only admin department employees can login");
          return false;
        }
      }
      
      const loggedInUser = loginUser(
        email, 
        password, 
        users,
        isEmailDomainAllowed
      );
      
      if (loggedInUser) {
        console.log("Login successful, user:", loggedInUser);
        
        // For demo users, ensure they have full permissions
        if (isDemoUser) {
          loggedInUser.role = 'admin';
          loggedInUser.modulePermissions = {
            superAdmin: true,
            incidentReporting: true,
            incidentAdmin: true,
            assessmentUser: true,
            assessmentsAdmin: true,
            employeeVerificationAdmin: true,
            grievancesAdmin: true,
            transportSafetyAdmin: true,
            eduSafeResourceAccess: true
          };
        }
        
        // Also sign in with Supabase
        try {
          await supabase.auth.signInWithPassword({
            email,
            password
          });
        } catch (error) {
          console.error("Supabase auth error (non-critical):", error);
        }
        
        setUser(loggedInUser);
        saveUserToStorage(loggedInUser);
        setAuthError(null);
        
        // Toast is now handled by the auth state change listener
        
        return true;
      }
      
      console.log("Login failed");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const addUser = async (userData: any) => {
    try {
      // Fixed Promise handling
      const updatedUsers = await addNewUser(
        users, 
        { ...userData, isActive: true }, 
        isEmailDomainAllowed
      );
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      // Fixed Promise handling
      const updatedUsers = await updateExistingUser(users, id, updates);
      if (updatedUsers) {
        setUsers(updatedUsers);
        
        // If the currently logged-in user is being updated, update their session too
        if (user && user.id === id) {
          const { password, ...updatesWithoutPassword } = updates;
          const updatedUser = { ...user, ...updatesWithoutPassword };
          setUser(updatedUser);
          saveUserToStorage(updatedUser);
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const deleteUser = (id: string) => {
    const updatedUsers = deleteExistingUser(users, id, user?.id);
    if (updatedUsers) {
      setUsers(updatedUsers);
    }
  };

  const deactivateUser = (id: string) => {
    const updatedUsers = deactivateExistingUser(users, id, user?.id);
    if (updatedUsers) {
      setUsers(updatedUsers);
      
      // If the currently logged-in user is being deactivated, log them out
      if (user && user.id === id) {
        logout();
      }
    }
  };

  const reactivateUser = (id: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        return { ...u, isActive: true };
      }
      return u;
    });
    
    setUsers(updatedUsers);
  };
  
  const logout = async () => {
    setUser(null);
    setAuthError(null);
    
    // Also sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signout error:", error);
    }
    
    // Redirect to login page
    navigate('/login');
  };
  
  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const updatedUsers = changePassword(users, user.id, currentPassword, newPassword);
    if (updatedUsers) {
      setUsers(updatedUsers);
      return true;
    }

    return false;
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
}
