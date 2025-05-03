
import { UserWithPassword, UserRole, ModulePermissions } from './types';

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
    name: 'SaaS Owner',
    email: 'owner@saasplatform.com',
    password: 'owner123',
    role: 'saas_owner',
    modulePermissions: DEFAULT_ADMIN_PERMISSIONS
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'admin@school.edu',
    password: 'admin123',
    role: 'admin',
    modulePermissions: DEFAULT_ADMIN_PERMISSIONS,
    clientId: '1'
  },
  {
    id: '3',
    name: 'Jeff Davis',
    email: 'reporter@school.edu',
    password: 'reporter123',
    role: 'reporter',
    modulePermissions: DEFAULT_REPORTER_PERMISSIONS,
    clientId: '1'
  }
];
