
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for checking employee access permissions
 */
export async function checkEmployeeAccess(email: string, setAuthError: (error: string | null) => void): Promise<boolean> {
  try {
    console.log("Checking access for:", email);
    
    // First try with exact email match
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .ilike('email', email)
      .single();
    
    if (error || !data) {
      console.log("Exact email match not found, trying with case-insensitive match");
      
      // Try with case-insensitive email comparison
      const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
        .from('employees')
        .select('*')
        .ilike('email', email);
      
      if (caseInsensitiveError || !caseInsensitiveData || caseInsensitiveData.length === 0) {
        console.error("Employee access check error:", error || caseInsensitiveError);
        setAuthError(`Access denied: No employee found with email ${email}`);
        return false;
      }
      
      // Find the first active admin
      const adminEmployee = caseInsensitiveData.find(emp => 
        emp.department === 'admin' && emp.status === 'active'
      );
      
      if (!adminEmployee) {
        console.error("No active admin employee found with email:", email);
        setAuthError("Access denied: Only active admin department employees can login");
        return false;
      }
      
      console.log("Found admin employee via case-insensitive search:", adminEmployee);
      return true;
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
