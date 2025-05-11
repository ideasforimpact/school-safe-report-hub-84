
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for checking employee access permissions
 */
export async function checkEmployeeAccess(email: string, setAuthError: (error: string | null) => void): Promise<boolean> {
  try {
    console.log("Checking access for:", email);
    
    // Updated employee query to be more permissive - just check if email exists
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error("Employee access check error:", error);
      setAuthError(`Access denied: Employee not found with email ${email}`);
      return false;
    }
    
    if (!data) {
      console.error("No employee found with email:", email);
      setAuthError("Access denied: No employee record found");
      return false;
    }
    
    // Check if employee is in admin department and active
    if (data.department !== 'admin' || data.status !== 'active') {
      console.error("Employee not in admin department or not active:", data);
      setAuthError("Access denied: Only active admin department employees can login");
      return false;
    }
    
    console.log("Active admin employee found:", data);
    return true;
  } catch (error) {
    console.error("Error checking employee access:", error);
    setAuthError("Error verifying employee access");
    return false;
  }
}
