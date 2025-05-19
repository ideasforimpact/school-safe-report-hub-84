import { User, UserWithPassword, UserRole, EmployeeData } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  loginUser, 
  saveUserToStorage,
  changeUserPassword as changePassword,
  saveEmployeeDataToStorage
} from '@/services/auth/authService';
import { 
  addNewUser,
  updateExistingUser,
  deleteExistingUser,
  deactivateExistingUser 
} from '@/services/auth/userManagementService';
import { excludePasswordFromUser } from '@/contexts/auth/utils';

// List of demo emails that can bypass the employee verification
const DEMO_EMAILS = [
  'owner@saasplatform.com',
  'admin@school.edu',
  'reporter@school.edu'
];

// Helper function to check employee access
const checkEmployeeAccess = async (email: string, setAuthError: (error: string | null) => void) => {
  try {
    // Check if the employee exists and is active in the employees table
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', true) // Using boolean status now
      .single();
    
    if (error || !data) {
      console.log("Employee verification failed:", error?.message || "Employee not found or inactive");
      setAuthError("Access denied: Only verified employees can login");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking employee access:", error);
    setAuthError("Error verifying employee status");
    return false;
  }
};

// New helper function to check domain access
const checkDomainAccess = async (email: string, employeeId: string, setAuthError: (error: string | null) => void) => {
  try {
    // First, check if the employee exists and if they are a super admin
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('is_super_admin, client_id')
      .eq('email', email.toLowerCase())
      .single();
      
    if (employeeError || !employee) {
      console.log("Employee data fetch failed:", employeeError?.message || "Employee not found");
      setAuthError("Access denied: Cannot retrieve employee information");
      return false;
    }
    
    // Check if employee has client_id
    if (!employee.client_id) {
      console.log("Employee has no client assignment");
      setAuthError("Access denied: Employee is not assigned to any client");
      return false;
    }
    
    // Get the client data to check domains
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('allowed_domains, super_admin_allowed_domain')
      .eq('id', employee.client_id)
      .single();
      
    if (clientError || !client) {
      console.log("Client data fetch failed:", clientError?.message || "Client not found");
      setAuthError("Access denied: Cannot retrieve client information");
      return false;
    }
    
    
    // Check if the email domain matches based on super admin status
    const emailDomain = email.split('@')[1].toLowerCase();
    
    if (employee.is_super_admin) {
      // Super admin needs to match super_admin_allowed_domain
      if (!client.super_admin_allowed_domain) {
        console.log("No super admin domain configured for this client");
        setAuthError("Access denied: No super admin domains configured for this client");
        return false;
      }
      
      const superAdminDomains = client.super_admin_allowed_domain.split(',').map(d => d.trim().toLowerCase());
      if (!superAdminDomains.includes(emailDomain)) {
        console.log("Email domain not in super admin allowed domains");
        setAuthError("Access denied: Email domain not authorized for super admin access");
        return false;
      }
      console.log("Super admin domain check passed");
    } else {
      console.log(client)
      // Regular user needs to match allowed_domains
      if (!client.allowed_domains) {
        console.log("No allowed domains configured for this client");
        setAuthError("Access denied: No domains configured for this client");
        return false;
      }
      
      const allowedDomains = client.allowed_domains.split(',').map(d => d.trim().toLowerCase());
      if (!allowedDomains.includes(emailDomain)) {
        console.log("Email domain not in allowed domains");
        setAuthError("Access denied: Email domain not authorized");
        return false;
      }
      console.log("Regular domain check passed");
    }
    
    return true;
  } catch (error) {
    console.error("Error checking domain access:", error);
    setAuthError("Error verifying domain access");
    return false;
  }
};

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
  isEmailDomainAllowed,
  setEmployeeData
}: {
  user: User | null;
  users: UserWithPassword[];
  setUser: (user: User | null) => void;
  setUsers: (users: UserWithPassword[]) => void;
  setAuthError: (error: string | null) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean;
  setEmployeeData?: (data: EmployeeData | null) => void;
}) {
  const navigate = useNavigate();

  const handleUserAuthentication = async (supabaseUser: any) => {
    // Clear any previous auth errors first
    setAuthError(null);
    
    // Check if user exists in our system
    console.log("Handling authentication for:", supabaseUser.email);
    
    // Check if this is a demo user - if so, bypass employee access check
    const isDemoUser = supabaseUser.email && DEMO_EMAILS.includes(supabaseUser.email);
    
    if (!isDemoUser) {
      // First check if employee exists and is active
      const hasEmployeeAccess = await checkEmployeeAccess(supabaseUser.email, setAuthError);
      if (!hasEmployeeAccess) {
        console.log("Access denied: Employee verification failed");
        await supabase.auth.signOut();
        toast.error("Access denied: Your email is not registered as an active employee");
        navigate('/login');
        return;
      }
      
      // Then check domain access based on super admin status and client configuration
      const hasDomainAccess = await checkDomainAccess(supabaseUser.email, supabaseUser.id, setAuthError);
      console.log(hasDomainAccess,"hasDomainAccess")
      if (!hasDomainAccess) {
        console.log("Access denied: Domain verification failed");
        await supabase.auth.signOut();
        toast.error("Access denied: Your email domain is not authorized");
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
        updatedUser.role = 'admin' as UserRole;
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
            role: 'admin' as UserRole,
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
      
      // Fetch employee data for the authenticated user
      try {
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type, status, employee_id')
          .eq('email', supabaseUser.email.toLowerCase())
          .single();
        
        if (employeeData && !error && setEmployeeData) {
          const employee: EmployeeData = {
            id: employeeData.id,
            clientId: employeeData.client_id,
            email: employeeData.email,
            firstName: employeeData.first_name,
            lastName: employeeData.last_name,
            isSuperAdmin: employeeData.is_super_admin,
            department: employeeData.department,
            employeeType: employeeData.employee_type,
            status: employeeData.status,
            employeeId: employeeData.employee_id
          };
          
          setEmployeeData(employee);
          saveEmployeeDataToStorage(employee);
          console.log("📝 Employee data stored in context after Google auth:", employee);
          console.log("Super Admin Status from DB:", employeeData.is_super_admin);
        } else {
          console.log("⚠️ No employee data found for Google auth user:", supabaseUser.email);
        }
      } catch (err) {
        console.error("❌ Error fetching employee data after Google auth:", err);
      }
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
      const isNewDemoUser = supabaseUser.email && DEMO_EMAILS.includes(supabaseUser.email);
      
      const newUser: UserWithPassword = {
        id: supabaseUser.id,
        firstName,
        lastName,
        email: supabaseUser.email || '',
        password: '', // SSO users don't need passwords in our system
        role: isNewDemoUser ? 'admin' as UserRole : 'admin' as UserRole, // Assign admin role since they've passed the employee check
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
        // First check if employee exists and is active
        const hasEmployeeAccess = await checkEmployeeAccess(email, setAuthError);
        if (!hasEmployeeAccess) {
          console.log("Access denied: Employee verification failed");
          setAuthError("Access denied: Only admin department employees can login");
          return false;
        }
        
        // Then check domain access
        const hasDomainAccess = await checkDomainAccess(email, "", setAuthError);
        if (!hasDomainAccess) {
          console.log("Access denied: Domain verification failed");
          setAuthError("Access denied: Your email domain is not authorized");
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
          loggedInUser.role = 'admin' as UserRole;
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
