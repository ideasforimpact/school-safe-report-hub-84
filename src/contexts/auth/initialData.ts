
import { UserWithPassword, UserRole, ModulePermissions, EmployeeType, DepartmentType } from './types';

// Default module permissions
export const DEFAULT_ADMIN_PERMISSIONS: ModulePermissions = {
  superAdmin: true,
  incidentReporting: true,
  incidentAdmin: true,
  assessmentUser: true,
  assessmentsAdmin: true,
  employeeVerificationAdmin: true,
  grievancesAdmin: true,
  transportSafetyAdmin: true,
  eduSafeResourceAccess: true
};

export const DEFAULT_REPORTER_PERMISSIONS: ModulePermissions = {
  superAdmin: false,
  incidentReporting: true,
  incidentAdmin: false,
  assessmentUser: true,
  assessmentsAdmin: false,
  employeeVerificationAdmin: false,
  grievancesAdmin: false,
  transportSafetyAdmin: false,
  eduSafeResourceAccess: true
};

// Mock users for demo purposes
export const INITIAL_MOCK_USERS: UserWithPassword[] = [
  {
    id: '1',
    firstName: 'SaaS',
    lastName: 'Owner',
    email: 'owner@saasplatform.com',
    password: 'owner123',
    role: 'saas_owner',
    modulePermissions: DEFAULT_ADMIN_PERMISSIONS,
    isActive: true,
    employeeId: 'EMP001',
    employeeType: 'permanent' as EmployeeType,
    department: 'admin' as DepartmentType,
    joiningDate: '2023-01-01',
    createdAt: '2023-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Smith',
    email: 'admin@school.edu',
    password: 'admin123',
    role: 'admin',
    modulePermissions: DEFAULT_ADMIN_PERMISSIONS,
    clientId: '1',
    isActive: true,
    employeeId: 'EMP002',
    employeeType: 'permanent' as EmployeeType,
    department: 'academics' as DepartmentType,
    joiningDate: '2023-02-15',
    createdAt: '2023-02-15T00:00:00.000Z'
  },
  {
    id: '3',
    firstName: 'Jeff',
    lastName: 'Davis',
    email: 'reporter@school.edu',
    password: 'reporter123',
    role: 'reporter',
    modulePermissions: DEFAULT_REPORTER_PERMISSIONS,
    clientId: '1',
    isActive: true,
    employeeId: 'EMP003',
    employeeType: 'contract' as EmployeeType,
    department: 'operations' as DepartmentType,
    joiningDate: '2023-03-20',
    createdAt: '2023-03-20T00:00:00.000Z'
  }
];
