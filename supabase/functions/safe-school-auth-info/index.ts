/**
 * POST /auth/info
 * Verify Supabase login and issue SafeSchool access tokens
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdminClient } from '../_shared/safe-school/supabaseClient.ts';
import { verifySupabaseToken } from '../_shared/safe-school/supabaseClient.ts';
import { validateAuthInfoRequest } from '../_shared/safe-school/validators.ts';
import { signAccessToken } from '../_shared/safe-school/jwt.ts';
import { generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry } from '../_shared/safe-school/tokenUtils.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/safe-school/rateLimiter.ts';
import { logger } from '../_shared/safe-school/logging.ts';
import { successResponse, errorResponse, rateLimitResponse } from '../_shared/safe-school/response.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

serve(async (req) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST method is allowed', 405);
  }

  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(clientId, '/auth/info');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { requestId, clientId });
      const response = rateLimitResponse(rateLimitResult.retryAfter || 60);
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter || 60));
      return response;
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = validateAuthInfoRequest(body);
    if (!validation.valid) {
      logger.debug('Validation failed', { requestId, errors: validation.errors });
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 422, validation.errors);
    }

    const { supabase_token, email } = body;

    let userEmail: string;

    // If supabase_token is provided, verify it; otherwise use email directly
    if (supabase_token) {
      // Verify Supabase token
      logger.info('Verifying Supabase token', { requestId });
      const { user: supabaseUser, error: verifyError } = await verifySupabaseToken(supabase_token);
      
      if (verifyError || !supabaseUser.email) {
        logger.warn('Supabase token verification failed', { requestId, error: verifyError?.message });
        return errorResponse('INVALID_TOKEN', 'Invalid or expired Supabase token', 401);
      }
      
      userEmail = supabaseUser.email;
    } else if (email) {
      // Use email directly (for cases where Supabase token is not available)
      userEmail = email.toLowerCase();
      logger.info('Using email directly (no Supabase token)', { requestId, email: userEmail });
    } else {
      // This should not happen due to validation, but just in case
      return errorResponse('VALIDATION_ERROR', 'Either supabase_token or email is required', 422);
    }

    // Find employee by email
    logger.info('Looking up employee', { requestId, email: userEmail });
    const supabase = getSupabaseAdminClient();
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*, client_id')
      .eq('email', userEmail)
      .single();

    if (employeeError || !employee) {
      logger.warn('Employee not found', { requestId, email: userEmail });
      return errorResponse('USER_NOT_FOUND', 'User not found in employees table', 404, [
        { field: 'email', reason: 'User does not exist in employees table' },
      ]);
    }

    // Validate IP whitelist (if client_id is available)
    if (employee.client_id) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(
        supabase,
        req,
        employee.client_id,
        url.pathname
      );
      
      if (!ipValidation.allowed) {
        logger.warn('IP not whitelisted', { 
          requestId, 
          clientId: employee.client_id, 
          reason: ipValidation.reason 
        });
        return errorResponse(
          'IP_NOT_WHITELISTED',
          'Access denied. Your IP address is not whitelisted for this client.',
          403
        );
      }
    }

    // Generate tokens
    logger.info('Generating tokens', { requestId, userId: employee.id });
    
    // Generate access token
    const accessToken = await signAccessToken({
      sub: employee.id,
      email: employee.email,
      role: employee.is_super_admin ? 'admin' : 'employee',
      permissions: {}, // Can be extended with actual permissions
    });

    // Generate refresh token
    const refreshToken = await generateRefreshToken();
    const tokenHash = await hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    // Store refresh token in database
    // device_info is optional and commented out for now
    const { error: tokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        revoked: false,
        // device_info: device_info || {},
        device_info: {},
        issued_by: 'auth-info',
      });

    if (tokenError) {
      logger.error('Failed to store refresh token', tokenError, { requestId, userId: employee.id });
      return errorResponse('INTERNAL_ERROR', 'Failed to store refresh token', 500);
    }

    // Get access token expiry
    const expiresIn = parseInt(Deno.env.get('ACCESS_TOKEN_EXP_SECONDS') || '3600', 10);

    logger.info('Tokens issued successfully', {
      requestId,
      userId: employee.id,
      duration: Date.now() - startTime,
    });

    // Return success response
    return successResponse(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        user: {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          employee_type: employee.employee_type,
          department: employee.department,
          client_id: employee.client_id || undefined,
          is_super_admin: employee.is_super_admin,
          role: employee.is_super_admin ? 'admin' : 'employee',
          permissions: {},
        },
      },
      'AUTH_OK',
      'Authentication successful',
    );
  } catch (error) {
    logger.error('Unexpected error in auth-info', error, { requestId });
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});

