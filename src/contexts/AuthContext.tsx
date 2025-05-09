
// This file is now just re-exporting from the refactored structure
// to maintain backward compatibility with existing imports

export { AuthProvider, useAuth } from './auth/AuthContext';
export type { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from './auth/types';
