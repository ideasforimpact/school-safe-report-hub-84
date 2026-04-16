
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setCurrentUser, setBackofficeUser, setAuthStatus } from '@/store/authActions';
import { setEmployeeData, setConfiguredModules } from '@/store/employeeActions';
import { User, EmployeeData } from '@/contexts/auth/types';
import { generateBackofficeToken } from '@/utils/jwtUtils';
import { saveAuthState } from '@/store/authPersistence';
import { getBackofficeDefaultPath } from '@/components/layout/sidebar/sidebarConfig';
import type { Module } from '@/components/layout/sidebar/sidebarConfig';
// Helper function to create fresh Supabase auth user with email provider
const createSupabaseAuthUser = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('Creating fresh Supabase auth user with email provider:', email);
    
    // Use Supabase's native signUp for fresh email provider authentication
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
     
    });

    if (error) {
      console.error('Error creating Supabase auth user:', error);
      return false;
    }

    if (data.user) {
      console.log('Successfully created fresh Supabase auth user:', data.user.id);
      console.log('User will need to confirm email before they can use Supabase auth');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Unexpected error creating Supabase auth user:', error);
    return false;
  }
};

export const useBackofficeAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useEmployeeStore();
  const navigate = useNavigate();

  const loginBackoffice = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Clean email (remove whitespace only, preserve case)
      const cleanedEmail = email.trim();
      
      console.log('Attempting backoffice login for email:', cleanedEmail);

      // Step 1: Check if user exists first
      const { data: existingUser, error: checkError } = await supabase
        .from('backoffice_users')
        .select('email')
        .eq('email', cleanedEmail)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking user existence:', checkError);
        setError("Database error occurred. Please try again.");
        setIsLoading(false);
        return false;
      }

      if (!existingUser) {
        console.log('User not found in backoffice_users table');
        setError("User not found. Please check your email address.");
        setIsLoading(false);
        return false;
      }

      // Step 2: Verify password with custom RPC without touching Supabase auth session.
      // This keeps user-portal and backoffice sessions independent in the same browser.
      const { data: customAuthResult, error: verifyError } = await supabase.rpc('verify_password', {
        email: cleanedEmail,
        password_attempt: password
      });

      if (verifyError) {
        console.error('Password verification error:', verifyError);
        setError("Authentication error occurred. Please try again.");
        setIsLoading(false);
        return false;
      }

      if (!customAuthResult) {
        console.log('Invalid password for user:', cleanedEmail);
        setError("Invalid password. Please try again.");
        setIsLoading(false);
        return false;
      }

      // Step 3: Fetch backoffice user information
      const { data: backofficeUser, error: userError } = await supabase
        .from('backoffice_users')
        .select('*')
        .eq('email', cleanedEmail)
        .maybeSingle();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        setError("Failed to retrieve user information. Please try again.");
        setIsLoading(false);
        return false;
      }

      if (!backofficeUser) {
        console.error('User not found after successful password verification');
        setError("User data not found. Please contact support.");
        setIsLoading(false);
        return false;
      }

      console.log('Successfully retrieved backoffice user:', { id: backofficeUser.id, email: backofficeUser.email });
      // Step 4: Update last_signed_in timestamp
      await supabase
        .from('backoffice_users')
        .update({ last_signed_in: new Date().toISOString() })
        .eq('id', backofficeUser.id);

      // Step 5: Create User object for Redux
      const saasUser: User = {
        id: backofficeUser.id,
        firstName: 'Backoffice',
        lastName: 'Admin',
        email: backofficeUser.email,
        role: 'saas_owner',
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
        createdAt: backofficeUser.created_at,
        client: null,
        clientType: null
      };

      // Step 6: Create EmployeeData object for Redux
      const backofficeEmployeeData: EmployeeData = {
        id: backofficeUser.id,
        clientId: null,
        email: backofficeUser.email,
        firstName: 'Backoffice',
        lastName: 'Admin',
        isSuperAdmin: true,
        department: 'Management',
        employeeType: 'admin',
        client: null,
        clientType: null
      };

      // Step 7: Fetch backoffice modules via edge function first (bypasses RLS/session constraints)
      let backofficeModules = [];
      try {
        const { data: moduleResponse, error: moduleError } = await supabase.functions.invoke('fetch-modules', {
          body: { fetchLevel: 'backoffice' }
        });

        if (moduleError) {
          throw moduleError;
        } else if (moduleResponse?.modules && Array.isArray(moduleResponse.modules)) {
          backofficeModules = moduleResponse.modules.map((module: any) => ({
            id: module.id,
            name: module.name,
            key: module.key || module.name?.toLowerCase().replace(/\s+/g, '_') || module.id,
            icon: module.icon || 'LayoutDashboard',
            level: module.level || 'backoffice',
            enabled: module.active ?? true,
            accessLevel: module.access_level || {},
            url: module.url || `/backoffice/${module.name?.toLowerCase().replace(/\s+/g, '-')}`,
            order: module.order,
            active: module.active ?? true,
            created_at: module.created_at,
            updated_at: module.updated_at
          }));
        }
      } catch (error) {
        console.error('Failed to fetch backoffice modules from source-of-truth endpoint', error);
        setError("Unable to load backoffice modules. Please contact your administrator.");
        toast.error("Unable to load backoffice modules.");
        setIsLoading(false);
        return false;
      }

      if (backofficeModules.length === 0) {
        setError("No active backoffice modules found. Please configure modules in the modules table.");
        toast.error("No active backoffice modules found.");
        setIsLoading(false);
        return false;
      }

      // Step 8: Generate browser-compatible token with 24-hour expiration
      const jwtToken = generateBackofficeToken(backofficeUser.id, backofficeUser.email);
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      // Step 9: Update Redux state with all necessary data
      dispatch(setCurrentUser(saasUser));
      dispatch(setBackofficeUser(true));
      dispatch(setAuthStatus(true));
      dispatch(setEmployeeData(backofficeEmployeeData));
      dispatch(setConfiguredModules(backofficeModules));

      // Step 10: Save auth state with JWT token to sessionStorage
      saveAuthState({
        currentUser: saasUser,
        isAuthenticated: true,
        isBackofficeUser: true,
        authError: null,
        configuredModules: backofficeModules,
        employeeData: backofficeEmployeeData,
        jwtToken,
        expiresAt,
        sessionType: 'backoffice' // Mark as backoffice session
      });

      console.log('Backoffice authentication successful:', {
        user: saasUser,
        employee: backofficeEmployeeData,
        modules: backofficeModules
      });

      const defaultBackofficePath = getBackofficeDefaultPath(backofficeModules);

      toast.success("Login successful! Redirecting to your module...");
      navigate(defaultBackofficePath);
      
      setIsLoading(false);
      return true;

    } catch (err) {
      console.error("Backoffice login error:", err);
      setError("An error occurred during login. Please try again.");
      toast.error("Login failed. Please check your credentials.");
      setIsLoading(false);
      return false;
    }
  };

  return {
    loginBackoffice,
    isLoading,
    error
  };
};
