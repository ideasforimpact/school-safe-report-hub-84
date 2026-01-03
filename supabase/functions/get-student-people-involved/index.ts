/**
 * Get Student People Involved API
 * External API endpoint for sharing student records with connected_school project
 * Requires API key authentication via api_configuration table
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Get encryption key from environment (must match the one used in api-configuration)
function getEncryptionKey(): string {
  return Deno.env.get('API_SECRET_ENCRYPTION_KEY');
}

// Helper function to decrypt secret_key to get client_id (two-way decryption)
async function decryptSecretKey(encryptedSecretKey: string): Promise<string> {
  const keyString = getEncryptionKey();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(keyString);
  
  // Derive the same key from the string using SHA-256
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedSecretKey), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt secret key: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

serve(async (req) => {
  const corsHeadersWithOrigin = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeadersWithOrigin,
        'Content-Length': '0'
      }
    });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Only allow GET method
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Only GET is supported.' }),
        { status: 405, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Extract API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('api-key') || req.headers.get('X-API-Key');
    
    // Error handling: Missing API key
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'API_KEY_MISSING',
          message: 'API key is required. Please provide API key in header (x-api-key, api-key, or X-API-Key).'
        }),
        { status: 401, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Find API configuration by API key
    const { data: apiConfig, error: fetchError } = await supabase
      .from('api_configuration')
      .select('id, client_id, api_key, secret_key, active')
      .eq('api_key', apiKey)
      .single();

    // Error handling: API key not found
    if (fetchError || !apiConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'API_KEY_INVALID',
          message: 'Invalid API key. The provided API key does not exist.'
        }),
        { status: 401, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Error handling: API key is inactive
    if (!apiConfig.active) {
      return new Response(
        JSON.stringify({ 
          error: 'API_KEY_INACTIVE',
          message: 'API key is inactive. Please contact administrator to activate your API key.'
        }),
        { status: 403, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt secret_key to get the client_id (two-way decryption)
    let decryptedClientId: string;
    try {
      decryptedClientId = await decryptSecretKey(apiConfig.secret_key);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'API_CONFIGURATION_DECRYPTION_FAILED',
          message: 'Failed to decrypt secret key. ' + (error instanceof Error ? error.message : 'Unknown error')
        }),
        { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Verify decrypted client_id matches the client_id from the record (digital signature verification)
    if (decryptedClientId !== apiConfig.client_id) {
      return new Response(
        JSON.stringify({ 
          error: 'API_CONFIGURATION_INVALID',
          message: 'API configuration validation failed. Decrypted client_id does not match stored client_id.'
        }),
        { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Both client_id from record and decrypted secret_key match - proceed with business logic
    const clientId = apiConfig.client_id;

    // TODO: Core business logic - Get student people involved data
    // For now, return successful response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Student people involved data retrieved successfully',
        data: {
          client_id: clientId,
          // TODO: Add actual student people involved data here
          students: []
        }
      }),
      { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-student-people-involved:', error);
    return new Response(
      JSON.stringify({ 
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
});

