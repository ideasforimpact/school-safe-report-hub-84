
import { UserWithPassword, UserRole, ModulePermissions, EmployeeType, DepartmentType } from './types';

// Default module permissions
export const DEFAULT_ADMIN_PERMISSIONS: ModulePermissions = {
  incidentReporting: true,
  allIncidents: true,
  insights: true,
  benchmarking: true
};

export const DEFAULT_REPORTER_PERMISSIONS: ModulePermissions = {
  incidentReporting: true,
  allIncidents: true,
  insights: true,
  benchmarking: false
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
    joiningDate: '2023-01-01'
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
    joiningDate: '2023-02-15'
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
    joiningDate: '2023-03-20'
  }
];
