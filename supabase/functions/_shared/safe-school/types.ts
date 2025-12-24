/**
 * Common types for SafeSchool Auth Service
 */

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code: string;
  message: string;
  data: T | null;
  errors?: Array<{ field: string; reason: string }> | null;
}

export interface ValidationError {
  field: string;
  reason: string;
}

export interface AuthInfoRequest {
  supabase_token?: string; // Optional - can also use email directly
  email?: string; // Alternative to supabase_token
  // device_info?: {
  //   ip?: string;
  //   user_agent?: string;
  //   app?: string;
  // };
}

export interface AuthInfoResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    employee_type: string;
    department: string;
    client_id?: string;
    is_super_admin: boolean;
    role?: string;
    permissions?: any;
  };
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface VerifyResponse {
  user: {
    sub: string;
    email: string;
    role?: string;
    permissions?: any;
    [key: string]: any;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  permissions?: any;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

