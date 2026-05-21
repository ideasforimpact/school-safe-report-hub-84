/**
 * JSON Schema validation for SafeSchool Auth Service
 * Using a simple validation approach (can be replaced with a proper JSON Schema library)
 */

import { ValidationError } from './types.ts';

/** Whitelisted SafeSchool auth modules (JWT `aud` + refresh_tokens.module). */
const AUTH_MODULE_WHITELIST = new Set(['visitor', 'child-audit']);

/**
 * Resolve module from request body. Defaults to `child-audit` when omitted.
 * @throws Error when `module` is present but not whitelisted
 */
export function getAuthModuleName(body: Record<string, unknown>): string {
  const raw = typeof body.module === 'string' ? body.module.trim().toLowerCase() : '';
  if (!raw) {
    throw new Error('module is required (e.g., "visitor" or "child-audit")');
  }
  if (!AUTH_MODULE_WHITELIST.has(raw)) {
    throw new Error(`Unsupported module: ${raw}`);
  }
  return raw;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate auth info request
 * Accepts either supabase_token OR email
 */
export function validateAuthInfoRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'body', reason: 'Request body must be a JSON object' }],
    };
  }

  // Either supabase_token OR email must be provided
  const hasSupabaseToken = body.supabase_token && typeof body.supabase_token === 'string' && body.supabase_token.trim() !== '';
  const hasEmail = body.email && typeof body.email === 'string' && body.email.trim() !== '';

  if (!hasSupabaseToken && !hasEmail) {
    errors.push({ field: 'supabase_token', reason: 'Either supabase_token or email is required' });
  }

  if (hasEmail && !isValidEmail(body.email)) {
    errors.push({ field: 'email', reason: 'email must be a valid email address' });
  }

  // device_info is optional and commented out for now
  // if (body.device_info !== undefined) {
  //   if (typeof body.device_info !== 'object' || body.device_info === null) {
  //     errors.push({ field: 'device_info', reason: 'device_info must be an object if provided' });
  //   } else {
  //     if (body.device_info.ip !== undefined && typeof body.device_info.ip !== 'string') {
  //       errors.push({ field: 'device_info.ip', reason: 'device_info.ip must be a string if provided' });
  //     }
  //     if (body.device_info.user_agent !== undefined && typeof body.device_info.user_agent !== 'string') {
  //       errors.push({ field: 'device_info.user_agent', reason: 'device_info.user_agent must be a string if provided' });
  //     }
  //     if (body.device_info.app !== undefined && typeof body.device_info.app !== 'string') {
  //       errors.push({ field: 'device_info.app', reason: 'device_info.app must be a string if provided' });
  //     }
  //   }
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate refresh request
 */
export function validateRefreshRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'body', reason: 'Request body must be a JSON object' }],
    };
  }

  if (!body.refresh_token || typeof body.refresh_token !== 'string' || body.refresh_token.trim() === '') {
    errors.push({ field: 'refresh_token', reason: 'refresh_token is required and must be a non-empty string' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate logout request
 */
export function validateLogoutRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'body', reason: 'Request body must be a JSON object' }],
    };
  }

  if (!body.refresh_token || typeof body.refresh_token !== 'string' || body.refresh_token.trim() === '') {
    errors.push({ field: 'refresh_token', reason: 'refresh_token is required and must be a non-empty string' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

