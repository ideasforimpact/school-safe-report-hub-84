
export interface UserRole {
  id: string;
  name: string;
}

export interface ModulePermissions {
  superAdmin?: boolean;
  incidentReporting?: boolean;
  incidentAdmin?: boolean;
  assessmentUser?: boolean;
  assessmentsAdmin?: boolean;
  employeeVerificationAdmin?: boolean;
  grievancesAdmin?: boolean;
  transportSafetyAdmin?: boolean;
  eduSafeResourceAccess?: boolean;
}

export interface EmployeeType {
  id: string;
  name: string;
}

export interface DepartmentType {
  id: string;
  name: string;
}

export interface ClientType {
  id: string;
  name: string;
  key: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  contact_person: string;
  phone: string;
  allowed_domains: string[];
  super_admin_allowed_domain: string;
  auth_providers: string[];
  creation_date: string;
  active: boolean;
  client_type_id: string;
  institution_type: string;
  logo: string;
  client_type: ClientType | null;
}

export interface Module {
  id: string;
  name: string;
  key: string;
  icon: string;
  level: string;
  enabled: boolean;
  accessLevel: any;
}

export interface EmployeeData {
  id: string;
  clientId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  department: DepartmentType | null;
  employeeType: EmployeeType | null;
  client?: Client | null;
  clientType?: ClientType | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  clientId?: string | null;
  client?: Client | null;
  clientType?: ClientType | null;
  modulePermissions?: ModulePermissions;
  createdAt?: string;
  provider?: string;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSaasOwner: boolean;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  authError: string | null;
  handleUserAuthentication: (supabaseUser: any) => Promise<void>;
  employeeData: EmployeeData | null;
}

export interface EmployeeState {
  // Authentication state
  currentUser: any | null;
  isAuthenticated: boolean;
  isBackofficeUser: boolean;
  authError: string | null;
  
  // Employee data
  employeeData: any | null;
  configuredModules: Module[];
  modulesRestored: boolean;
  isLoading: boolean;
  error: string | null;
  clientId: string | null;
}

export enum EmployeeActionTypes {
  SET_CURRENT_USER = 'SET_CURRENT_USER',
  SET_BACKOFFICE_USER = 'SET_BACKOFFICE_USER',
  SET_AUTH_STATUS = 'SET_AUTH_STATUS',
  SET_AUTH_ERROR = 'SET_AUTH_ERROR',
  CLEAR_AUTH = 'CLEAR_AUTH',
  SET_EMPLOYEE_DATA = 'SET_EMPLOYEE_DATA',
  SET_CONFIGURED_MODULES = 'SET_CONFIGURED_MODULES',
  SET_MODULES_RESTORED = 'SET_MODULES_RESTORED',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_CLIENT_ID = 'SET_CLIENT_ID',
  RESET_EMPLOYEE = 'RESET_EMPLOYEE',
}

export interface SetCurrentUserAction {
  type: EmployeeActionTypes.SET_CURRENT_USER;
  payload: any;
}

export interface SetBackofficeUserAction {
  type: EmployeeActionTypes.SET_BACKOFFICE_USER;
  payload: boolean;
}

export interface SetAuthStatusAction {
  type: EmployeeActionTypes.SET_AUTH_STATUS;
  payload: boolean;
}

export interface SetAuthErrorAction {
  type: EmployeeActionTypes.SET_AUTH_ERROR;
  payload: string | null;
}

export interface ClearAuthAction {
  type: EmployeeActionTypes.CLEAR_AUTH;
}

interface SetEmployeeDataAction {
  type: EmployeeActionTypes.SET_EMPLOYEE_DATA;
  payload: any;
}

interface SetConfiguredModulesAction {
  type: EmployeeActionTypes.SET_CONFIGURED_MODULES;
  payload: Module[];
}

interface SetModulesRestoredAction {
  type: EmployeeActionTypes.SET_MODULES_RESTORED;
  payload: boolean;
}

interface SetLoadingAction {
  type: EmployeeActionTypes.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: EmployeeActionTypes.SET_ERROR;
  payload: string | null;
}

interface SetClientIdAction {
  type: EmployeeActionTypes.SET_CLIENT_ID;
  payload: string | null;
}

interface ResetEmployeeAction {
  type: EmployeeActionTypes.RESET_EMPLOYEE;
}

export type EmployeeAction = 
  | SetCurrentUserAction
  | SetBackofficeUserAction
  | SetAuthStatusAction
  | SetAuthErrorAction
  | ClearAuthAction
  | SetEmployeeDataAction
  | SetConfiguredModulesAction
  | SetModulesRestoredAction
  | SetLoadingAction
  | SetErrorAction
  | SetClientIdAction
  | ResetEmployeeAction;
