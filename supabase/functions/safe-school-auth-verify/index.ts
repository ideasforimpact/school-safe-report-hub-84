/**
 * GET /auth/verify
 * Verify an access token and return user claims
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdminClient } from '../_shared/safe-school/supabaseClient.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/safe-school/rateLimiter.ts';
import { logger } from '../_shared/safe-school/logging.ts';
import { successResponse, errorResponse, rateLimitResponse } from '../_shared/safe-school/response.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

serve(async (req) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only GET method is allowed', 405);
  }

  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(clientId, '/auth/verify');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { requestId, clientId });
      const response = rateLimitResponse(rateLimitResult.retryAfter || 60);
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter || 60));
      return response;
    }

    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('MISSING_TOKEN', 'Authorization header with Bearer token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (error) {
      logger.warn('Token verification failed', { requestId, error: error instanceof Error ? error.message : String(error) });
      return errorResponse('INVALID_TOKEN', 'Invalid or expired access token', 401);
    }

    // Optionally verify that user still exists in employees table
    const supabase = getSupabaseAdminClient();
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, status')
      .eq('id', payload.sub)
      .single();

    if (employeeError || !employee) {
      logger.warn('Employee not found for token', { requestId, userId: payload.sub });
      return errorResponse('USER_NOT_FOUND', 'User associated with token not found', 401);
    }

    if (!employee.status) {
      logger.warn('Employee is inactive', { requestId, userId: payload.sub });
      return errorResponse('USER_INACTIVE', 'User account is inactive', 401);
    }

    // Get client_id from token payload
    const clientId = payload.client_id || payload.clientId || null;
    
    // Validate IP whitelist (if client_id is available)
    if (clientId) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(
        supabase,
        req,
        clientId,
        url.pathname
      );
      
      if (!ipValidation.allowed) {
        logger.warn('IP not whitelisted', { 
          requestId, 
          clientId, 
          reason: ipValidation.reason 
        });
        return errorResponse(
          'IP_NOT_WHITELISTED',
          'Access denied. Your IP address is not whitelisted for this client.',
          403
        );
      }
    }

    logger.info('Token verified successfully', { requestId, userId: payload.sub });

    // Return user claims
    return successResponse(
      {
        user: {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions,
          iss: payload.iss,
          iat: payload.iat,
          exp: payload.exp,
        },
      },
      'VERIFY_OK',
      'Token is valid',
    );
  } catch (error) {
    logger.error('Unexpected error in auth-verify', error, { requestId });
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});

