/**
 * Get CORS headers for edge function responses
 * Supports both wildcard (*) and specific origin matching
 */
export function getCorsHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'false',
  };

  // If a specific origin is provided in the request, use it (for better security in production)
  if (request) {
    const origin = request.headers.get('Origin');
    if (origin) {
      // For UAT/production, you might want to validate against allowed origins
      // For now, we'll use the origin from the request if present
      headers['Access-Control-Allow-Origin'] = origin;
    }
  }

  return headers;
}

/**
 * Default CORS headers (backward compatibility)
 * Use getCorsHeaders() for better origin handling
 */
export const corsHeaders = getCorsHeaders();