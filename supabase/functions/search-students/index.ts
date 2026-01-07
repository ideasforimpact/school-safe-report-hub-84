/**
 * Search Students API
 * Searches students internally first, then externally if not found
 * Returns students with is_external flag
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Secure comparison function to prevent timing attacks
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

// Transform student data to include is_external flag
// For external students, gender, email, and status may not be available
// For internal students, these fields are also not selected in the query
function transformStudent(student: any, isExternal: boolean = false,clientId:string) {
  return {
    id: student.id,
    student_id: student.student_id,
    name: student.name,
    // Handle optional fields - use null if not present (for both internal and external)
    gender: student.gender !== undefined ? student.gender : null,
    email: student.email !== undefined ? student.email : null,
    status: student.status !== undefined ? student.status : null,
    grade_id: student.grade_id,
    section_id: student.section_id,
    external_client_id: student.client_id,
    client_id  : clientId,
    grades: student.grades ? {
      id: student.grades.id,
      name: student.grades.name
    } : null,
    sections: student.sections ? {
      id: student.sections.id,
      name: student.sections.name
    } : null,
    is_external: isExternal
  };
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

  
    
   


    // Get query parameters
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('search')?.trim() || '';
    const queryClientId = url.searchParams.get('client_id')?.trim() || '';

    // Validate query parameters
    if (!queryClientId) {
      return new Response(
        JSON.stringify({ error: 'client_id query parameter is required' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'search query parameter is required' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

   

    // Sanitize search term (max 100 characters)
    const sanitizedSearch = searchTerm.substring(0, 100);

    console.log(`[Search Students] Searching for: "${sanitizedSearch}" in client: ${queryClientId}`);

    // ========== STEP 1: Check if Integration is Enabled ==========
    // Check if client has integration enabled (is_linked === true and active === true)
    const { data: clientIntegration, error: integrationError } = await supabase
      .from('client_integration')
      .select('target_client_id, is_linked, active')
      .eq('client_id', queryClientId)
      .eq('is_linked', true)
      .eq('active', true)
      .maybeSingle();

    if (integrationError) {
      console.error('[Search Students] Error fetching client integration:', integrationError);
      // If integration lookup fails, fall back to internal search
      console.log('[Search Students] Integration lookup failed, falling back to internal search');
    }

    const isIntegrationEnabled = clientIntegration && clientIntegration.is_linked === true && clientIntegration.active === true;

    // ========== STEP 2: Route Based on Integration Status ==========
    if (isIntegrationEnabled) {
      // Integration is enabled - only return external results
      console.log('[Search Students] Integration enabled - searching external API only');
      
      const externalClientId = clientIntegration.target_client_id;
      
      if (!externalClientId) {
        console.log('[Search Students] No external client ID found, returning empty results');
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            client_id: queryClientId
          }),
          { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Search Students] External client ID found: ${externalClientId}`);

      // ========== STEP 3: Call External API ==========
      const integrationApiKey = Deno.env.get('INTEGRATION_API_KEY');
      const connectedSchoolBaseUrl = Deno.env.get('CONNECTED_SCHOOL_BASE_URL');
      
      if (!integrationApiKey || !connectedSchoolBaseUrl) {
        console.log('[Search Students] Integration API key or base URL not configured');
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            client_id: queryClientId
          }),
          { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      const externalApiUrl = `${connectedSchoolBaseUrl}/functions/v1/share_student_records_with_connected_school?search=${encodeURIComponent(sanitizedSearch)}&client_id=${encodeURIComponent(externalClientId)}`;
      
      console.log(`[Search Students] Calling external API: ${externalApiUrl}`);

      try {
        const externalResponse = await fetch(externalApiUrl, {
          method: 'GET',
          headers: {
            'x-api-key': integrationApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!externalResponse.ok) {
          console.error(`[Search Students] External API error: ${externalResponse.status} ${externalResponse.statusText}`);
          return new Response(
            JSON.stringify({
              success: true,
              data: [],
              client_id: queryClientId
            }),
            { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        const externalData = await externalResponse.json();
        console.log(`[Search Students] External API response:`, externalData);

        // Transform external students with is_external: true
        const externalStudents = externalData.data || [];
        const transformedExternalStudents = externalStudents.map((student: any) => 
          transformStudent(student, true, queryClientId)
        );

        console.log(`[Search Students] Found ${transformedExternalStudents.length} external student(s)`);

        return new Response(
          JSON.stringify({
            success: true,
            data: transformedExternalStudents,
            client_id: queryClientId
          }),
          { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );

      } catch (externalError) {
        console.error('[Search Students] Error calling external API:', externalError);
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            client_id: queryClientId
          }),
          { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Integration is not enabled - only search internal database
      console.log('[Search Students] Integration not enabled - searching internal database only');
      
      // ========== STEP 3: Search Internal Students ==========
      let query = supabase
        .from('students')
        .select(`
          id,
          student_id,
          name,
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
        .eq('client_id', queryClientId);

      // Apply search filter
      if (sanitizedSearch) {
        query = query.or(`name.ilike.%${sanitizedSearch}%`);
      }

      const { data: internalStudents, error: internalError } = await query;

      if (internalError) {
        console.error('[Search Students] Error fetching internal students:', internalError);
        return new Response(
          JSON.stringify({ error: 'Failed to search internal students', msg: internalError }),
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Transform internal students with is_external: false
      const transformedInternalStudents = (internalStudents || []).map(student => 
        transformStudent(student, false, queryClientId)
      );

      console.log(`[Search Students] Found ${transformedInternalStudents.length} internal student(s)`);

      return new Response(
        JSON.stringify({
          success: true,
          data: transformedInternalStudents,
          client_id: queryClientId
        }),
        { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Search Students] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
});

