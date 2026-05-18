/**
 * POST /auth/refresh
 * Exchange refresh token for new access token (with rotation)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdminClient } from '../_shared/safe-school/supabaseClient.ts';
import { validateRefreshRequest, getAuthModuleName } from '../_shared/safe-school/validators.ts';
import { signAccessToken } from '../_shared/safe-school/jwt.ts';
import { generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry } from '../_shared/safe-school/tokenUtils.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/safe-school/rateLimiter.ts';
import { logger } from '../_shared/safe-school/logging.ts';
import { successResponse, errorResponse, rateLimitResponse } from '../_shared/safe-school/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

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
    const rateLimitResult = checkRateLimit(clientId, '/auth/refresh');
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

    const validation = validateRefreshRequest(body);
    if (!validation.valid) {
      logger.debug('Validation failed', { requestId, errors: validation.errors });
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 422, validation.errors);
    }

    const moduleName = getAuthModuleName(body);
    const refresh_token = typeof body.refresh_token === "string" ? body.refresh_token : "";

    logger.info("Refresh module resolved", { requestId, moduleName, bodyModule: body.module });

    // Hash the provided refresh token
    const tokenHash = await hashRefreshToken(refresh_token);

    // Look up the refresh token in database
    const supabase = getSupabaseAdminClient();
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .eq('module', moduleName)
      .single();

    if (tokenError || !tokenRecord) {
      logger.warn('Invalid refresh token', { requestId });
      return errorResponse('REFRESH_INVALID', 'Invalid or revoked refresh token', 401);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < now) {
      logger.warn('Expired refresh token', { requestId, tokenId: tokenRecord.id });
      // Mark as revoked
      await supabase
        .from('refresh_tokens')
        .update({ revoked: true })
        .eq('id', tokenRecord.id);
      
      return errorResponse('REFRESH_INVALID', 'Refresh token has expired', 401);
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', tokenRecord.user_id)
      .single();

    if (employeeError || !employee) {
      logger.warn('Employee not found for refresh token', { requestId, userId: tokenRecord.user_id });
      return errorResponse('REFRESH_INVALID', 'User associated with token not found', 401);
    }

    // Generate new tokens (rotation)
    logger.info('Rotating tokens', { requestId, userId: employee.id });

    // Generate new access token
      const accessToken = await signAccessToken(
      {
        sub: employee.id,
        email: employee.email,
      role: employee.is_super_admin ? 'admin' : 'employee',
        permissions: {},
      },
      moduleName,
    );

    // Generate new refresh token
    const newRefreshToken = await generateRefreshToken();
    const newTokenHash = await hashRefreshToken(newRefreshToken);
    const newExpiresAt = getRefreshTokenExpiry();

    // Store new refresh token and revoke old one (transaction-like behavior)
    const { error: revokeError } = await supabase
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('id', tokenRecord.id);

    if (revokeError) {
      logger.error('Failed to revoke old token', revokeError, { requestId, tokenId: tokenRecord.id });
      // Continue anyway - the new token will still be created
    }

    const { error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
      user_id: employee.id,
      token_hash: newTokenHash,
      expires_at: newExpiresAt.toISOString(),
      revoked: false,
        // device_info: tokenRecord.device_info || {},
      device_info: {},
      issued_by: 'auth-refresh',
      module: moduleName,
    });

    if (insertError) {
      logger.error('Failed to store new refresh token', insertError, { requestId, userId: employee.id });
      return errorResponse('INTERNAL_ERROR', 'Failed to store new refresh token', 500);
    }

    // Get access token expiry
    const expiresIn = parseInt(Deno.env.get('ACCESS_TOKEN_EXP_SECONDS') || '300', 10);

    logger.info('Tokens rotated successfully', { requestId, userId: employee.id });

    // Return success response
    return successResponse(
      {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
      },
      'REFRESH_OK',
      'Token refresh successful',
    );
  } catch (error) {
    logger.error('Unexpected error in auth-refresh', error, { requestId });
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});

