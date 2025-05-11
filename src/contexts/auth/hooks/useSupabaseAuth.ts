
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { saveUserToStorage } from '@/services/auth/authService';
import { excludePasswordFromUser } from '../utils';
import { UserWithPassword } from '../types';

/**
 * Hook for handling Supabase authentication
 */
export function useSupabaseAuth({
  users,
  setUser,
  setAuthError,
  setIsAuthInitialized,
  authInitCompleteRef,
  handleUserAuthentication
}: {
  users: UserWithPassword[];
  setUser: (user: any) => void;
  setAuthError: (error: string | null) => void;
  setIsAuthInitialized: (initialized: boolean) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  handleUserAuthentication: (supabaseUser: any) => Promise<void>;
}) {
  const navigate = useNavigate();

  // Set up Supabase auth listener
  useEffect(() => {
    console.log("Setting up Supabase auth listener");
    
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Handle potential deadlock by using setTimeout - this is important!
        setTimeout(() => {
          console.log("Processing authenticated user:", session.user.email);
          handleUserAuthentication(session.user);
        }, 10);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthError(null);
      }
    });
    
    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Initial session check:", session?.user?.email);
      if (error) {
        console.error("Session check error:", error);
      }
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks
        setTimeout(() => {
          console.log("Processing existing session user:", session.user.email);
          handleUserAuthentication(session.user);
        }, 10);
      } else {
        // Mark auth as initialized and complete even if no session
        setIsAuthInitialized(true);
        authInitCompleteRef.current = true;
      }
    });
    
    return () => {
      console.log("Cleaning up Supabase auth listener");
      subscription.unsubscribe();
    };
  }, [users, navigate, setUser, setAuthError, setIsAuthInitialized, authInitCompleteRef, handleUserAuthentication]);

  // Logout function
  const logout = async () => {
    setUser(null);
    setAuthError(null);
    
    // Also sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signout error:", error);
    }
    
    // Redirect to login page
    navigate('/login');
  };

  return { logout };
}
