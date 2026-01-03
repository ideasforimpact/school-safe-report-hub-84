/**
 * Get Students API
 * External API endpoint for sharing student records
 * Requires API key authentication via INTEGRATION_API_KEY environment variable
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get Supabase URL - tries local name first, then cloud name
 */
function getSupabaseUrl(): string {
  let url = Deno.env.get('URL') ?? 
            Deno.env.get('SUPABASE_URL') ?? 
            '';
  return url;
}

/**
 * Get Supabase Service Role Key - tries local name first, then cloud name
 */
function getSupabaseServiceRoleKey(): string {
  return Deno.env.get('SERVICE_ROLE_KEY') ?? 
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 
         '';
}

/**
 * Get CORS headers for edge function responses
 */
function getCorsHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'false',
  };

  // If a specific origin is provided in the request, use it
  if (request) {
    const origin = request.headers.get('Origin');
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  }

  return headers;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      }
    });
  }

  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed. Only GET is supported.' 
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== AUTHENTICATION ==========
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'API_KEY_MISSING',
          message: 'API key is required. Please provide API key in header (x-api-key).'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get INTEGRATION_API_KEY from environment
    const integrationApiKey = Deno.env.get('INTEGRATION_API_KEY');
    
    if (!integrationApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'API_CONFIGURATION_ERROR',
          message: 'INTEGRATION_API_KEY environment variable is not configured.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key matches INTEGRATION_API_KEY
    if (apiKey !== integrationApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'API_KEY_INVALID',
          message: 'Invalid API key. The provided API key does not match.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== QUERY PARAMS VALIDATION ==========
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id')?.trim();
    const search = url.searchParams.get('search')?.trim();

    // Check if both client_id and search exist
    if (!clientId || !search) {
      // Provide more detailed error message
      const missingParams = [];
      if (!clientId) missingParams.push('client_id');
      if (!search) missingParams.push('search');
      
      return new Response(
        JSON.stringify({ 
          error: 'QUERY_PARAMS_MISSING',
          message: `Missing required query parameters: ${missingParams.join(', ')}. Please ensure the URL is properly formatted without spaces (e.g., ?client_id=xxx&search=yyy).`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== CORE LOGIC ==========
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Fetch students with relationships (grades and sections)
    // Select: id, student_id, name, gender, email, status, grade_id, section_id, client_id
    // Include relationship data from grades and sections tables
    // Apply search filter across name, student_id, and email fields
    let query = supabase
      .from('students')
      .select(`
        id,
        student_id,
        name,
        gender,
        email,
        status,
        grade_id,
        section_id,
        client_id,
        grades!students_grade_id_fkey (
          id,
          name
        ),
        sections!students_section_id_fkey (
          id,
          name
        )
      `)
      .eq('client_id', clientId);

    // Apply search filter - search across name, student_id, and email fields
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      // Use .or() with proper Supabase syntax: field.operator.value,field.operator.value
      query = query.or(`name.ilike.%${searchTerm}%`);
    }

    const { data: students, error: fetchError } = await query;

    // Handle database errors
    if (fetchError) {
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: `Failed to fetch students: ${fetchError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no students found, return 200 with empty array and client_id
    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          client_id: clientId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return students data with client_id
    return new Response(
      JSON.stringify({ 
        data: students,
        client_id: clientId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-students:', error);
    return new Response(
      JSON.stringify({ 
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
