
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

      // Step 2: Try Supabase auth first, then fallback to custom verification
      let authUser = null;
      let isValidCredentials = false;

      await supabase.auth.signOut();
      // First, try Supabase's built-in email authentication
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password: password
        });

        console.log('Supabase auth attempt:', { authError, authData, email: cleanedEmail });

        if (!authError && authData?.user) {
          console.log('Successfully authenticated with Supabase auth:', authData.user.id);
          authUser = authData.user;
          isValidCredentials = true;
        } else if (authError) {
          console.log('Supabase auth failed (expected for local dev), will try custom verification:', authError.message);
        }
      } catch (authErr: any) {
        console.log('Supabase auth exception, trying custom verification:', authErr?.message || authErr);
      }

      // If Supabase auth failed, try custom RPC verification
      if (!isValidCredentials) {
        console.log('Trying custom password verification...');
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

        isValidCredentials = true;
        console.log('Custom authentication successful, will attempt to create Supabase auth user');
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

      // Step 3: If custom auth was used and no Supabase auth user exists, try to create one
      if (!authUser && isValidCredentials) {
        console.log('Custom auth successful, attempting to create Supabase auth user for future logins...');
        const authUserCreated = await createSupabaseAuthUser(cleanedEmail, password);
        if (authUserCreated) {
          // Try to get the newly created auth user
          const { data: newAuthData } = await supabase.auth.signInWithPassword({
            email: cleanedEmail,
            password: password
          });
          if (newAuthData?.user) {
            authUser = newAuthData.user;
            console.log('Supabase auth user created and retrieved:', authUser.id);
          } else {
            console.log('Auth user created but could not retrieve it, continuing with custom auth');
          }
        } else {
          console.log('Failed to create Supabase auth user, but continuing with custom auth');
        }
      }
      
      console.log('Auth user status:', authUser ? `User ID: ${authUser.id}` : 'No auth user (using custom auth)');
      
      // Step 4: Update last_signed_in timestamp
      const updateData: any = { last_signed_in: new Date().toISOString() };
      if (authUser?.id) {
        updateData.auth_user_id = authUser.id;
      }
      await supabase
        .from('backoffice_users')
        .update(updateData)
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

      // Step 7: Fetch backoffice modules from database
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('level', 'backoffice')
        .eq('active', true)
        .order('order', { ascending: true, nullsFirst: false });

      let backofficeModules = [];
      if (!modulesError && modulesData) {
        backofficeModules = modulesData.map(module => ({
          id: module.id,
          name: module.name,
          key: module.name.toLowerCase().replace(/\s+/g, '_'),
          icon: module.icon || 'LayoutDashboard',
          level: module.level,
          enabled: module.active,
          accessLevel: {},
          url: module.url,
          order: module.order,
          active: module.active,
          created_at: module.created_at,
          updated_at: module.updated_at
        }));
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

      // Step 11: Log RLS debug context so we can see auth.uid, client_id, admin flag
      // Wait a bit for the session to be fully propagated before checking RLS context
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify session is still valid before calling RPC
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.error('❌ RLS DEBUG: No valid session found after backoffice login:', sessionError);
      } else {
        console.log('⚠️ RLS DEBUG: Starting RLS policy check after backoffice login');
        
        try {
          console.log('🔍 RLS DEBUG: Calling debug_current_rls_context RPC...');
          const { data: rlsDebug, error: rpcError } = await supabase.rpc('debug_current_rls_context');
          
          if (rpcError) {
            console.error('❌ RLS DEBUG: RPC call failed:', rpcError);
            console.error('❌ RLS DEBUG: Error details:', {
              message: rpcError.message,
              code: rpcError.code,
              details: rpcError.details,
              hint: rpcError.hint
            });
          } else {
            console.log('📊 RLS DEBUG: RPC response received:', rlsDebug);
            
            if (rlsDebug && Array.isArray(rlsDebug) && rlsDebug[0]) {
              console.log('✅ RLS DEBUG: RLS context (backoffice login):', JSON.stringify(rlsDebug[0], null, 2));
            } else {
              console.warn('⚠️ RLS DEBUG: RLS context (backoffice login): no data returned or empty array');
              console.warn('⚠️ RLS DEBUG: Response type:', typeof rlsDebug, 'Is array:', Array.isArray(rlsDebug));
            }
          }
        } catch (rlsErr) {
          console.error('❌ RLS DEBUG: Exception fetching RLS debug context (backoffice login):', rlsErr);
          console.error('❌ RLS DEBUG: Exception details:', {
            name: rlsErr instanceof Error ? rlsErr.name : 'Unknown',
            message: rlsErr instanceof Error ? rlsErr.message : String(rlsErr),
            stack: rlsErr instanceof Error ? rlsErr.stack : undefined
          });
        }
      }

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
