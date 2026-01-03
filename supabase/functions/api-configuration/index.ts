/**
 * API Configuration Management
 * Handles creation, listing, viewing, and deletion of API keys for client integrations
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Helper function to generate SHA-256 hash (for API key generation)
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get encryption key from environment or use a default (should be set in production)
function getEncryptionKey(): string {
  return Deno.env.get('API_SECRET_ENCRYPTION_KEY') || 'default-api-secret-key-change-in-production';
}

// Helper function to encrypt client_id using AES-GCM
async function encryptClientId(clientId: string): Promise<string> {
  const keyString = getEncryptionKey();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  
  // Derive a key from the string using SHA-256
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate a random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the client_id
  const data = encoder.encode(clientId);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  // Combine IV and encrypted data, then encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64 for storage
  const base64 = btoa(String.fromCharCode(...combined));
  return base64;
}

// Helper function to decrypt secret_key to get client_id
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
}

// Helper function to generate API key with prefix pk_1214
async function generateApiKey(): Promise<string> {
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const combined = `${timestamp}_${randomStr}_${crypto.randomUUID()}`;
  const hash = await sha256Hash(combined);
  // Return prefix pk_1214 followed by the hash
  return `pk_1214_${hash.substring(0, 32)}`;
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
    const url = new URL(req.url);
    const method = req.method;

    // POST - Create API configuration
    if (method === 'POST') {
      const body = await req.json();
      const { client_id, employee_id } = body;

      // Validate required fields
      if (!client_id) {
        return new Response(
          JSON.stringify({ error: 'client_id is required' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      if (!employee_id) {
        return new Response(
          JSON.stringify({ error: 'employee_id is required' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Check if API configuration already exists for this client
      const { data: existingConfig } = await supabase
        .from('api_configuration')
        .select('id')
        .eq('client_id', client_id)
        .eq('active', true)
        .single();

      if (existingConfig) {
        return new Response(
          JSON.stringify({ error: 'API configuration already exists for this client' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Generate API key with prefix pk_1214
      const apiKey = await generateApiKey();
      
      // Encrypt client_id using AES-GCM to create secret_key (two-way encryption)
      const secretKey = await encryptClientId('84c29679-4deb-46df-af3b-7c1855b63c38');

      // Insert API configuration
      const { data: apiConfig, error: insertError } = await supabase
        .from('api_configuration')
        .insert({
          client_id: client_id,
          api_key: apiKey,
          secret_key: secretKey,
          active: true,
          created_by: employee_id,
          updated_by: employee_id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating API configuration:', insertError);
        return new Response(
          JSON.stringify({ error: `Failed to create API configuration: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'API configuration created successfully',
          data: {
            id: apiConfig.id,
            api_key: apiConfig.api_key,
            active: apiConfig.active,
            created_at: apiConfig.created_at
          }
        }),
        { status: 201, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // GET - List or get single API configuration
    if (method === 'GET') {
      const configId = url.searchParams.get('id');
      const clientId = url.searchParams.get('client_id');

      if (configId) {
        // Get single API configuration
        const { data, error } = await supabase
          .from('api_configuration')
          .select('id, api_key, active, created_at, updated_at')
          .eq('id', configId)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'API configuration not found' }),
            { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      } else if (clientId) {
        // List all API configurations for the client
        const { data, error } = await supabase
          .from('api_configuration')
          .select('id, api_key, active, created_at, updated_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: data || [] }),
          { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Either id or client_id parameter is required' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }
    }

    // PUT - Update API configuration (mainly for active status)
    if (method === 'PUT') {
      const body = await req.json();
      const { id, active, employee_id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Verify API configuration exists
      const { data: apiConfig, error: fetchError } = await supabase
        .from('api_configuration')
        .select('id, client_id')
        .eq('id', id)
        .single();

      if (fetchError || !apiConfig) {
        return new Response(
          JSON.stringify({ error: 'API configuration not found' }),
          { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (active !== undefined) {
        updateData.active = active;
      }

      if (employee_id) {
        updateData.updated_by = employee_id;
      }

      // Update API configuration
      const { data: updatedConfig, error: updateError } = await supabase
        .from('api_configuration')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'API configuration updated successfully',
          data: updatedConfig
        }),
        { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete API configuration
    if (method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Verify API configuration exists
      const { data: apiConfig, error: fetchError } = await supabase
        .from('api_configuration')
        .select('id, client_id')
        .eq('id', id)
        .single();

      if (fetchError || !apiConfig) {
        return new Response(
          JSON.stringify({ error: 'API configuration not found' }),
          { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Delete API configuration
      const { error: deleteError } = await supabase
        .from('api_configuration')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'API configuration deleted successfully' }),
        { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in api-configuration:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
});

