
import { useState, useRef } from 'react';
import { User, UserWithPassword, EmployeeData, ModulePermissions } from '../types';
import { initialUsers } from '../initialData';

// Define the return type of useAuthState 
interface AuthState {
  user: User | null;
  users: UserWithPassword[];
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUsers: React.Dispatch<React.SetStateAction<UserWithPassword[]>>;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isSaasOwner: boolean;
  isAdmin: boolean;
  modulePermissions: ModulePermissions;
  employeeData: EmployeeData | null;
  setEmployeeData: React.Dispatch<React.SetStateAction<EmployeeData | null>>;
  authInitCompleteRef: React.MutableRefObject<boolean>;
}

// Hook for managing authentication state
export const useAuthState = (): AuthState => {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserWithPassword[]>(initialUsers);
  
  // Auth status and errors
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Track employee data for authenticated users
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  
  // Auth initialization tracking
  const authInitCompleteRef = useRef<boolean>(false);
  
  // Compute user role properties
  const isSaasOwner = user?.role === 'saas_owner';
  const isAdmin = user?.role === 'admin' || user?.role === 'saas_owner';
  
  // Get permissions from the user object or provide default empty permissions
  const modulePermissions: ModulePermissions = user?.modulePermissions || {
    superAdmin: false,
    incidentReporting: false,
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: false,
    eduSafeResourceAccess: false
  };

  return {
    user,
    users,
    setUser,
    setUsers,
    authError,
    setAuthError,
    isLoading,
    setIsLoading,
    isSaasOwner,
    isAdmin,
    modulePermissions,
    employeeData,
    setEmployeeData,
    authInitCompleteRef
  };
};
