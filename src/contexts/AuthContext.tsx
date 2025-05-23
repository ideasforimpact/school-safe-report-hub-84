
// This file is now just re-exporting from the refactored structure
// to maintain backward compatibility with existing imports

export { AuthProvider, useAuth, AuthContext } from './auth';
export type { User, UserRole, ModulePermissions, EmployeeType, DepartmentType, EmployeeData, AuthContextType } from './auth/types';
