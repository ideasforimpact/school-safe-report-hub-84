
import { useState, useCallback } from 'react';
import { User, UserRole, EmployeeData } from '../types';
import { getUserFromStorage, saveUserToStorage, saveEmployeeDataToStorage } from '@/services/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export const useAuthHandlers = ({
  user,
  users,
  setUser,
  setUsers,
  setAuthError,
  authInitCompleteRef,
  setEmployeeData
}: UseAuthHandlersProps) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Handle user authentication from various providers (Google, etc.)
  const handleUserAuthentication = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser || isProcessingAuth) return;
    
    try {
      setIsProcessingAuth(true);

      console.log("Processing authentication for user:", supabaseUser.email);
      
      // Check if we already have a saved user
      const savedUser = getUserFromStorage();
      
      // If the saved user email matches, don't re-process
      if (savedUser && savedUser.email === supabaseUser.email) {
        console.log("Using existing user data from storage");
        setUser(savedUser);
        setAuthError(null);
        setIsProcessingAuth(false);
        authInitCompleteRef.current = true;
        return;
      }
      
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
          .select('id, client_id, employee_type, first_name, last_name, email, status, user_id')
          .eq('user_id', supabaseUser.id)
          .single();
          
        if (!error && data) {
          employeeData = {
            id: data.id,
            clientId: data.client_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email
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
            await supabase.auth.signOut();
            setIsProcessingAuth(false);
            return;
          }
          
          console.log("Found employee record by user_id:", employeeData);
        }
      }
      
      // If not found by ID, try by email
      if (!employeeData && supabaseUser.email) {
        const { data, error } = await supabase
          .from('employees')
          .select('id, client_id, employee_type, first_name, last_name, email, status, user_id')
          .eq('email', supabaseUser.email.toLowerCase())
          .single();
          
        if (!error && data) {
          employeeData = {
            id: data.id,
            clientId: data.client_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email
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
        }
      }
      
      // Fetch module permissions from the database if we have an employee
      let modulePermissions = {
        superAdmin: false,
        incidentReporting: false,
        incidentAdmin: false,
        assessmentUser: false,
        assessmentsAdmin: false,
        employeeVerificationAdmin: false,
        grievancesAdmin: false,
        transportSafetyAdmin: false,
        eduSafeResourceAccess: false
      };
      
      if (employeeData?.id) {
        try {
          const { data: moduleData, error: moduleError } = await supabase
            .from('employee_modules')
            .select('module_id, roles(key)')
            .eq('employee_id', employeeData.id);
          
          if (!moduleError && moduleData && moduleData.length > 0) {
            console.log("Employee module permissions:", moduleData);
            
            // Map the permissions to our modulePermissions object
            moduleData.forEach(module => {
              if (module.roles?.key) {
                const moduleKey = module.roles.key;
                if (moduleKey in modulePermissions) {
                  modulePermissions[moduleKey as keyof typeof modulePermissions] = true;
                } else {
                  console.log("Unknown module_id:", module.module_id);
                }
              }
            });
          }
        } catch (error) {
          console.error("Error fetching module permissions:", error);
        }
      }
      
      console.log("Module permissions set:", modulePermissions);
      
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
        modulePermissions,
        createdAt: supabaseUser.created_at || new Date().toISOString()
      };

      // Save the user to localStorage and context
      setUser(newUser);
      saveUserToStorage(newUser);
      
      // Save employee data to localStorage and context
      if (employeeData) {
        console.log("Employee data being saved:", employeeData);
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
    } finally {
      setIsProcessingAuth(false);
    }
  }, [isProcessingAuth, setAuthError, setUser, authInitCompleteRef, setEmployeeData, users, setUsers]);

  return { handleUserAuthentication };
};
