
// This file re-exports the refactored auth components to maintain backward compatibility
// with existing imports that reference @/contexts/auth/AuthContext

import { AuthContext, AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType, EmployeeData, AuthContextType } from './types';

export { AuthContext, AuthProvider, useAuth };
export type { User, UserRole, ModulePermissions, EmployeeType, DepartmentType, EmployeeData, AuthContextType };
