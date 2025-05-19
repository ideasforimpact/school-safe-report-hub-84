
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserWithPassword } from '../types';

interface SupabaseAuthProps {
  handleUserAuthentication: (supabaseUser: any) => Promise<void>;
  setAuthError: (error: string) => void;
  authInitCompleteRef: React.MutableRefObject<boolean>;
  users?: UserWithPassword[]; // Make users optional
  setUser?: (user: any) => void; // Make setUser optional
  setIsAuthInitialized?: (initialized: boolean) => void; // Make setIsAuthInitialized optional
}

export const useSupabaseAuth = ({
  handleUserAuthentication,
  setAuthError,
  authInitCompleteRef,
  users = [],
  setUser = () => {},
  setIsAuthInitialized = () => {}
}: SupabaseAuthProps) => {
  useEffect(() => {
    // Subscribe to auth changes to keep state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            console.log("Auth state change detected with user:", session.user.email);
            await handleUserAuthentication(session.user);
          } else {
            console.log("Auth state change: No user session");
            if (setUser) {
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          setAuthError("Failed to process authentication");
        }
      }
    );
    
    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session;
        
        if (initialSession?.user) {
          console.log("Initial session found for user:", initialSession.user.email);
          await handleUserAuthentication(initialSession.user);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
        setAuthError("Failed to check authentication status");
      } finally {
        // Set auth as initialized
        authInitCompleteRef.current = true;
        if (setIsAuthInitialized) {
          setIsAuthInitialized(true);
        }
      }
    };
    
    checkInitialSession();
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
};
