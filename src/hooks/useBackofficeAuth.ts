
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

export const useBackofficeAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useEmployeeStore();
  const navigate = useNavigate();

  const loginBackoffice = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Verify credentials using RPC function
      const { data: isValidCredentials, error: verifyError } = await supabase.rpc('verify_password', { 
        email, 
        password_attempt: password 
      });

      if (verifyError || !isValidCredentials) {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
        return false;
      }

      // Step 2: Fetch backoffice user information
      const { data: backofficeUser, error: userError } = await supabase
        .from('backoffice_users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userError || !backofficeUser) {
        setError("Error retrieving user data");
        setIsLoading(false);
        return false;
      }

      // Step 3: Update last_signed_in timestamp
      await supabase
        .from('backoffice_users')
        .update({ last_signed_in: new Date().toISOString() })
        .eq('id', backofficeUser.id);

      // Step 4: Create User object for Redux
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

      // Step 5: Create EmployeeData object for Redux
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

      // Step 6: Fetch backoffice modules from database
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
          enabled: true,
          accessLevel: {}
        }));
      }

      // Step 7: Generate browser-compatible token with 24-hour expiration
      const jwtToken = generateBackofficeToken(backofficeUser.id, backofficeUser.email);
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      // Step 8: Update Redux state with all necessary data
      dispatch(setCurrentUser(saasUser));
      dispatch(setBackofficeUser(true));
      dispatch(setAuthStatus(true));
      dispatch(setEmployeeData(backofficeEmployeeData));
      dispatch(setConfiguredModules(backofficeModules));

      // Step 9: Save auth state with JWT token to sessionStorage
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

      toast.success("Login successful! Redirecting to dashboard...");
      navigate("/backoffice/dashboard");
      
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
