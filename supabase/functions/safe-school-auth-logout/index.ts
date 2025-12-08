/**
 * POST /auth/logout
 * Revoke a refresh token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdminClient } from '../_shared/safe-school/supabaseClient.ts';
import { validateLogoutRequest } from '../_shared/safe-school/validators.ts';
import { hashRefreshToken } from '../_shared/safe-school/tokenUtils.ts';
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
    const rateLimitResult = checkRateLimit(clientId, '/auth/logout');
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

    const validation = validateLogoutRequest(body);
    if (!validation.valid) {
      logger.debug('Validation failed', { requestId, errors: validation.errors });
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 422, validation.errors);
    }

    const { refresh_token } = body;

    // Hash the provided refresh token
    const tokenHash = await hashRefreshToken(refresh_token);

    // Look up and revoke the refresh token
    const supabase = getSupabaseAdminClient();
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .single();

    if (tokenError || !tokenRecord) {
      // Token not found or already revoked - still return success (idempotent)
      logger.debug('Token not found or already revoked', { requestId });
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Mark token as revoked
    const { error: updateError } = await supabase
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('id', tokenRecord.id);

    if (updateError) {
      logger.error('Failed to revoke token', updateError, { requestId, tokenId: tokenRecord.id });
      return errorResponse('INTERNAL_ERROR', 'Failed to revoke token', 500);
    }

    logger.info('Token revoked successfully', { requestId, tokenId: tokenRecord.id });

    // Return 204 No Content (preferred for logout)
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    logger.error('Unexpected error in auth-logout', error, { requestId });
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});

