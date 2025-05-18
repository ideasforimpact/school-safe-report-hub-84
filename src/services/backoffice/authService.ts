
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
    // Check if this is a demo email
    const isDemoUser = DEMO_EMAILS.includes(email);
    
    if (isDemoUser && password === 'owner123') {
      console.log("Using demo user login");
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

    console.log("Attempting regular login with:", email);
    
    // For real users, verify password with Supabase function
    const { data: isValidPassword, error: verifyError } = await supabase.rpc('verify_password', { 
      email, 
      password_attempt: password 
    });

    if (verifyError) {
      console.error("Password verification error:", verifyError);
      toast.error("Authentication failed: " + verifyError.message);
      return null;
    }

    if (!isValidPassword) {
      console.error("Invalid credentials");
      toast.error("Invalid email or password");
      return null;
    }

    console.log("Password verified, fetching user details");

    // If password is valid, fetch user details
    const { data: backofficeUser, error: userError } = await supabase
      .from('backoffice_users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (userError || !backofficeUser) {
      console.error("Error fetching backoffice user:", userError);
      toast.error("Error retrieving user information");
      return null;
    }
    
    console.log("User fetched successfully:", backofficeUser.email);
    
    // Update last_signed_in
    await supabase
      .from('backoffice_users')
      .update({ last_signed_in: new Date().toISOString() })
      .eq('id', backofficeUser.id);

    // Map database record to BackofficeUser type
    // Note: The database fields may not match our BackofficeUser type exactly,
    // so we need to map them properly and provide fallbacks
    return {
      id: backofficeUser.id,
      // The database doesn't have first_name/last_name fields, so provide defaults
      firstName: 'Backoffice', // Default first name
      lastName: 'Admin',       // Default last name
      email: backofficeUser.email,
      role: backofficeUser.is_saas_admin ? 'saas_owner' : 'backoffice_admin',
      isActive: true,
      createdAt: backofficeUser.created_at,
      lastLogin: new Date().toISOString()
    };
  } catch (error) {
    console.error("Unexpected error during backoffice login:", error);
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
