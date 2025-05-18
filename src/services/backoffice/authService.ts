
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
    console.log(`🔧 authService: Login attempt started for: ${email}`);
    
    // Check if this is a demo email
    const isDemoUser = DEMO_EMAILS.includes(email);
    
    if (isDemoUser && password === 'owner123') {
      console.log("🔧 authService: Using demo user login");
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
    
    // For non-demo users, we need to check if the email exists first
    console.log("🔧 authService: Checking if account exists in backoffice_users table...");
    
    // First check if user exists in backoffice_users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('backoffice_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userCheckError) {
      // If error is not-found, give a clear message
      if (userCheckError.code === 'PGRST116') {
        console.error(`🔧 authService: Account not found for email: ${email}`);
        console.error("🔧 Error details:", userCheckError);
        toast.error("Account not found. Please check your email or contact an administrator.");
        return null;
      }
      
      console.error("🔧 authService: Error checking user existence:", userCheckError);
      toast.error("Error checking user account");
      return null;
    }
    
    console.log("🔧 authService: Account found, proceeding to verify password...");
    console.log("🔧 authService: User data from DB:", existingUser);
    
    // For real users, verify password with Supabase function
    console.log("🔧 authService: Calling verify_password RPC function");
    const { data: isValidPassword, error: verifyError } = await supabase.rpc('verify_password', { 
      email, 
      password_attempt: password 
    });

    console.log("🔧 authService: Password verification result:", isValidPassword);
    console.log("🔧 authService: Password verification error:", verifyError);
    
    if (verifyError) {
      console.error("🔧 authService: Password verification error:", verifyError);
      toast.error("Authentication failed: " + verifyError.message);
      return null;
    }

    if (!isValidPassword) {
      console.error("🔧 authService: Invalid credentials - password verification failed");
      toast.error("Invalid email or password");
      return null;
    }

    console.log("🔧 authService: Password verified successfully, building user object");

    // Map database record to BackofficeUser type
    // Since first_name, last_name, and is_active don't exist in the DB schema,
    // we'll use default values or derive them from other fields
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
    
    console.log("🔧 authService: User object created:", backofficeUser);
    
    // Update last_signed_in
    const { error: updateError } = await supabase
      .from('backoffice_users')
      .update({ last_signed_in: new Date().toISOString() })
      .eq('id', backofficeUser.id);
      
    if (updateError) {
      console.error("🔧 authService: Error updating last_signed_in:", updateError);
    } else {
      console.log("🔧 authService: Updated last_signed_in successfully");
    }

    console.log("🔧 authService: Login successful, returning user");
    return backofficeUser;
  } catch (error) {
    console.error("🔧 authService: Unexpected error during backoffice login:", error);
    toast.error("An unexpected error occurred during login");
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
