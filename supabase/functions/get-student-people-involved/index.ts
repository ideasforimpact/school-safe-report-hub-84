/**
 * Get Student People Involved API
 * External API endpoint for sharing student incident records
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
 * Secure comparison function to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Get CORS headers for edge function responses
 */
function getCorsHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, x-api-key',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

    // Validate API key matches INTEGRATION_API_KEY using secure comparison
    if (!secureCompare(apiKey, integrationApiKey)) {
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

    // Check if client_id exists
    if (!clientId) {
      return new Response(
        JSON.stringify({ 
          error: 'QUERY_PARAMS_MISSING',
          message: 'Missing required query parameter: client_id. Please ensure the URL is properly formatted (e.g., ?client_id=xxx).'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate client_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      return new Response(
        JSON.stringify({ 
          error: 'INVALID_CLIENT_ID',
          message: 'Invalid client_id format. client_id must be a valid UUID.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== CORE LOGIC ==========
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Fetch incident_external_students records where external_client_id matches query client_id
    // Include relationships: incidents (with type, category, subcategory, status) and external_students
    const { data: incidentExternalStudents, error: fetchError } = await supabase
      .from('incident_external_students')
      .select(`
        incident_id,
        external_student_id,
        incidents!incident_external_students_incident_id_fkey (
          id,
          type_id,
          incident_report_types!incidents_type_id_fkey (
            id,
            name
          ),
          incident_categories!incidents_category_id_fkey (
            id,
            name
          ),
          incident_subcategories!incidents_subcategory_id_fkey (
            id,
            name
          ),
          incident_status!fk_incident_status (
            id,
            name
          )
        ),
        external_students!incident_external_students_external_student_id_fkey (
          external_student_id,
          name,
          student_id
        )
      `)
      .eq('external_client_id', clientId);

    // Handle database errors
    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: `Failed to fetch student people involved data: ${fetchError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no records found, return 200 with empty array
    if (!incidentExternalStudents || incidentExternalStudents.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          client_id: clientId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== TRANSFORM DATA ==========
    // Group by external student (each student can have multiple incidents)
    const studentMap = new Map<string, any>();

    for (const record of incidentExternalStudents) {
      const incident = (record as any).incidents;
      const externalStudent = (record as any).external_students;

      // Skip if incident or external_student data is missing
      if (!incident || !externalStudent) {
        continue;
      }

      const externalStudentId = externalStudent.external_student_id;
      
      // Initialize student entry if not exists
      if (!studentMap.has(externalStudentId)) {
        studentMap.set(externalStudentId, {
          external_student_id: externalStudent.external_student_id,
          name: externalStudent.name,
          student_id: externalStudent.student_id,
          incidents: []
        });
      }

      // Add incident to student's incidents array
      const student = studentMap.get(externalStudentId);
      
      // Transform incident data
      const transformedIncident = {
        id: incident.id,
        type_id: incident.type_id,
        type: incident.incident_report_types ? {
          id: incident.incident_report_types.id,
          name: incident.incident_report_types.name
        } : null,
        category: incident.incident_categories ? {
          id: incident.incident_categories.id,
          name: incident.incident_categories.name
        } : null,
        subcategory: incident.incident_subcategories ? {
          id: incident.incident_subcategories.id,
          name: incident.incident_subcategories.name
        } : null,
        status: incident.incident_status ? {
          id: incident.incident_status.id,
          name: incident.incident_status.name
        } : null
      };

      student.incidents.push(transformedIncident);
    }

    // Convert map to array
    const result = Array.from(studentMap.values());

    // Return transformed data
    return new Response(
      JSON.stringify({ 
        data: result,
        client_id: clientId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-student-people-involved:', error);
    return new Response(
      JSON.stringify({ 
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
