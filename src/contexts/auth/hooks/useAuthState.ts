
import React, { useState, useRef } from 'react';
import { User, UserWithPassword } from '../types';
import { getUserFromStorage, getUsersFromStorage } from '@/services/auth/authService';

/**
 * Hook for managing authentication state
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(() => getUserFromStorage());
  const [users, setUsers] = useState<UserWithPassword[]>(() => getUsersFromStorage());
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
