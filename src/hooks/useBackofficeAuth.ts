
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setCurrentUser, setBackofficeUser, setAuthStatus } from '@/store/authActions';
import { setEmployeeData, setConfiguredModules } from '@/store/employeeActions';
import { User, EmployeeData } from '@/contexts/auth/types';

export const useBackofficeAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useEmployeeStore();

  const fetchBackofficeModules = async () => {
    try {
      console.log('Fetching backoffice modules from database');
      
      const { data: modulesData, error } = await supabase
        .from('modules')
        .select('*')
        .eq('level', 'backoffice')
        .eq('active', true)
        .order('order', { ascending: true, nullsFirst: false });
        
      if (error) {
        console.error('Error fetching backoffice modules:', error);
        return [];
      }
      
      if (!modulesData || modulesData.length === 0) {
        console.log('No active backoffice modules found');
        return [];
      }
      
      console.log(`Found ${modulesData.length} backoffice modules:`, modulesData.map(m => m.name));
      
      // Convert to the expected format
      const modules = modulesData.map(module => ({
        id: module.id,
        name: module.name,
        key: module.name.toLowerCase().replace(/\s+/g, '_'),
        icon: module.icon || 'LayoutDashboard',
        level: module.level,
        enabled: true,
        accessLevel: {},
        order: module.order || 999,
        url: module.url || `/${module.name.toLowerCase().replace(/\s+/g, '-')}`
      }));
      
      return modules;
    } catch (error) {
      console.error('Error in fetchBackofficeModules:', error);
      return [];
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return false;
    }

    try {
      setIsLoading(true);
      console.log('Starting backoffice authentication for:', email);

      // Verify password using RPC function
      const { data: isValidPassword, error: rpcError } = await supabase.rpc('verify_password', { 
        email: email.toLowerCase(), 
        password_attempt: password 
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        toast.error("Authentication failed. Please try again.");
        return false;
      }

      if (!isValidPassword) {
        toast.error("Invalid email or password");
        return false;
      }

      // Fetch the backoffice user
      const { data: backofficeUser, error: userError } = await supabase
        .from('backoffice_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
        
      if (userError || !backofficeUser) {
        console.error('Error fetching backoffice user:', userError);
        toast.error("User not found");
        return false;
      }
      
      // Update last_signed_in
      await supabase
        .from('backoffice_users')
        .update({ last_signed_in: new Date().toISOString() })
        .eq('id', backofficeUser.id);
      
      console.log('Backoffice authentication successful for user:', backofficeUser);
      
      // Create user object for Redux
      const user: User = {
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
      
      // Create employee data for Redux
      const employeeData: EmployeeData = {
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
      
      // Fetch modules from database
      const modules = await fetchBackofficeModules();
      
      // Update Redux state with all necessary data
      console.log('Updating Redux state with backoffice data');
      dispatch(setCurrentUser(user));
      dispatch(setBackofficeUser(true));
      dispatch(setAuthStatus(true));
      dispatch(setEmployeeData(employeeData));
      dispatch(setConfiguredModules(modules));
      
      console.log('Redux state updated successfully');
      toast.success("Login successful! Redirecting to dashboard...");
      
      // Navigate to backoffice dashboard
      navigate("/backoffice/dashboard");
      return true;
      
    } catch (error) {
      console.error("Backoffice login error:", error);
      toast.error("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading
  };
};
