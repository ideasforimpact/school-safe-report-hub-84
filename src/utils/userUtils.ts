
import { User } from '@/contexts/auth/types';

// Helper function to format a user's full name
export const formatUserFullName = (user: User | null): string => {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`;
};
