
import { useState, useRef } from 'react';
import { User, UserWithPassword } from '../types';

/**
 * Hook for managing authentication state
 */
export function useAuthState() {
  // Initialize with null values instead of getting from localStorage
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const authInitCompleteRef = useRef(false);
  
  return {
    user,
    setUser,
    users,
    setUsers,
    authError,
    setAuthError,
    isAuthInitialized,
    setIsAuthInitialized,
    authInitCompleteRef
  };
}
