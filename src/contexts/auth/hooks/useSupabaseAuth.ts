
import { useEffect, useRef } from 'react';
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
  const authListenerRef = useRef<{ subscription?: { unsubscribe: () => void } }>({}); 

  // Set up Supabase auth listener
  useEffect(() => {
    console.log("Setting up Supabase auth listener");
    
    // Clean up any existing subscription to prevent duplicates
    if (authListenerRef.current.subscription) {
      console.log("Cleaning up existing auth listener before setting up a new one");
      authListenerRef.current.subscription.unsubscribe();
    }
    
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
    
    // Store the subscription in the ref for later cleanup
    authListenerRef.current.subscription = subscription;
    
    // Check for existing session only once during component mount
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
    
    // Return cleanup function that will run when component unmounts
    return () => {
      console.log("Cleaning up Supabase auth listener");
      if (authListenerRef.current.subscription) {
        authListenerRef.current.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to ensure this only runs once on mount

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
