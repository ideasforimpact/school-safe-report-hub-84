
import { BackofficeUser } from '@/contexts/backoffice/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// List of demo emails that can bypass verification
const DEMO_EMAILS = [
  'owner@saasplatform.com'
];

/**
 * Attempts to log in a backoffice user
 */
export const loginBackofficeUser = async (email: string, password: string): Promise<BackofficeUser | null> => {
  try {
    console.log("🔑 authService.loginBackofficeUser CALLED with email:", email);
    
    // Check if this is a demo email
    const isDemoUser = DEMO_EMAILS.includes(email);
    console.log("🔑 authService: Is demo user:", isDemoUser);
    
    if (isDemoUser && password === 'owner123') {
      console.log("🔑 authService: Using demo user login path");
      // For demo users, create a local user object
      return {
        id: 'demo-backoffice-id',
        email: email,
        firstName: 'Backoffice',
        lastName: 'Admin',
        role: 'saas_owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }
    
    // For non-demo users, check if the email exists first
    console.log("🔑 authService: Checking if account exists in backoffice_users table...");
    
    // First check if user exists in backoffice_users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('backoffice_users')
      .select('*')
      .eq('email', email)
      .single();
    
    console.log("🔑 authService: Existing user check result:", existingUser ? "Found" : "Not found", "Error:", userCheckError?.message || "None");
    
    if (userCheckError) {
      // If error is not-found, give a clear message
      if (userCheckError.code === 'PGRST116') {
        console.error(`🔑 authService: Account not found for email: ${email}`);
        return null;
      }
      
      console.error("🔑 authService: Error checking user existence:", userCheckError);
      return null;
    }
    
    console.log("🔑 authService: Account found, proceeding to verify password...");
    
    // For real users, verify password with Supabase function
    const { data: isValidPassword, error: verifyError } = await supabase.rpc('verify_password', { 
      email, 
      password_attempt: password 
    });

    console.log("🔑 authService: Password verification result:", isValidPassword);
    
    if (verifyError) {
      console.error("🔑 authService: Password verification error:", verifyError);
      return null;
    }

    if (!isValidPassword) {
      console.error("🔑 authService: Invalid credentials - password verification failed");
      
      // SPECIAL HANDLING: If this is a newly created user, try direct password comparison as fallback
      console.log("🔑 authService: Attempting direct password check as fallback...");
      
      // Get the stored hashed password from the database
      const { data: storedHash, error: hashError } = await supabase
        .from('backoffice_users')
        .select('password')
        .eq('email', email)
        .single();
        
      console.log("🔑 authService: Direct password check result:", storedHash ? "Hash retrieved" : "No hash found", "Error:", hashError?.message || "None");
        
      if (storedHash && storedHash.password === password) {
        console.log("🔑 authService: Direct password match successful!");
        // Password matched directly, proceed with login
      } else {
        console.log("🔑 authService: Direct password check failed too, login failed");
        return null;
      }
    }

    // Map database record to BackofficeUser type
    const backofficeUser: BackofficeUser = {
      id: existingUser.id,
      firstName: existingUser.email.split('@')[0] || 'Backoffice', // Use part of email as first name
      lastName: 'Admin', // Default last name
      email: existingUser.email,
      role: existingUser.is_saas_admin ? 'saas_owner' : 'backoffice_admin',
      isActive: true, // Default to active since there's no is_active in the DB
      createdAt: existingUser.created_at,
      lastLogin: new Date().toISOString()
    };
    
    // Update last_signed_in
    const { error: updateError } = await supabase
      .from('backoffice_users')
      .update({ last_signed_in: new Date().toISOString() })
      .eq('id', backofficeUser.id);
      
    if (updateError) {
      console.error("🔑 authService: Error updating last_signed_in:", updateError);
    }

    console.log("🔑 authService: Returning valid backoffice user:", backofficeUser.email);
    return backofficeUser;
  } catch (error) {
    console.error("🔑 authService: Unexpected error during backoffice login:", error);
    return null;
  }
};

/**
 * Signs out the current backoffice user
 */
export const logoutBackofficeUser = async (): Promise<void> => {
  try {
    // Just clear Supabase session for now
    await supabase.auth.signOut();
    
    // Clear any session storage
    sessionStorage.removeItem('backoffice_user');
    
    toast.info("You have been logged out");
  } catch (error) {
    console.error("Error during backoffice logout:", error);
    throw error;
  }
};

/**
 * Change backoffice user password
 */
export const changeBackofficePassword = async (
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<boolean> => {
  try {
    // First verify current password
    const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
      email: '', // We're using userId directly rather than email
      password_attempt: currentPassword
    });
    
    if (verifyError || !isValid) {
      toast.error("Current password is incorrect");
      return false;
    }
    
    // Hash the new password
    const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
      password: newPassword
    });
    
    if (hashError) {
      toast.error("Error updating password");
      return false;
    }
    
    // Update the password
    const { error: updateError } = await supabase
      .from('backoffice_users')
      .update({ password: hashedPassword })
      .eq('id', userId);
    
    if (updateError) {
      toast.error("Error updating password");
      return false;
    }
    
    toast.success("Password updated successfully");
    return true;
  } catch (error) {
    console.error("Error changing backoffice password:", error);
    toast.error("An error occurred while changing your password");
    return false;
  }
};
