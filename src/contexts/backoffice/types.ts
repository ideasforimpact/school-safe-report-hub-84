
export interface BackofficeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;  // Keep this as string for the backoffice system
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface BackofficeAuthContextType {
  user: BackofficeUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  setUser?: React.Dispatch<React.SetStateAction<BackofficeUser | null>>;
}
