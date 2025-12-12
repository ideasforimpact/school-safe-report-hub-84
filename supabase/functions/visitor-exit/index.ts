/**
 * Visitor Exit API
 * Updates visitor is_exit flag to true when visitor exits the premises
 * Requires: visitor_id, client_id, employee_id
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Helper function to extract and verify token, then get employee and client info
async function getAuthenticatedUserInfo(req: Request, supabase: any): Promise<{
  employeeId: string;
  clientId: string;
  error?: Response;
}> {
  // Extract token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Authorization header with Bearer token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the token
  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (error) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Get employee_id from token (sub field)
  const employeeId = payload.sub;

  // Get employee record to get client_id
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, client_id, status')
    .eq('id', employeeId)
    .single();

  if (employeeError || !employee) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  if (!employee.status) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Employee account is inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  if (!employee.client_id) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Employee does not have a client_id assigned' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return {
    employeeId: employee.id,
    clientId: employee.client_id
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Only POST is supported.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and verify token, get employee_id and client_id
    const authInfo = await getAuthenticatedUserInfo(req, supabase);
    if (authInfo.error) {
      return authInfo.error;
    }

    const authenticatedEmployeeId = authInfo.employeeId;
    const authenticatedClientId = authInfo.clientId;

    // Parse request body
    const body = await req.json();
    const { visitor_id, client_id, employee_id } = body;

    // Validate required fields
    if (!visitor_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: visitor_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: client_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: employee_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that provided client_id matches authenticated user's client_id
    if (client_id !== authenticatedClientId) {
      return new Response(
        JSON.stringify({ error: 'client_id does not match authenticated user\'s client' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that provided employee_id matches authenticated user's employee_id
    if (employee_id !== authenticatedEmployeeId) {
      return new Response(
        JSON.stringify({ error: 'employee_id does not match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if visitor exists and belongs to the specified client and employee
    const { data: visitor, error: fetchError } = await supabase
      .from('visitors')
      .select('id, client_id, employee_id, is_exit')
      .eq('id', visitor_id)
      .eq('client_id', client_id)
      .eq('employee_id', employee_id)
      .single();

    if (fetchError || !visitor) {
      return new Response(
        JSON.stringify({ error: 'Visitor not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if visitor has already exited
    if (visitor.is_exit === true) {
      return new Response(
        JSON.stringify({ 
          error: 'Visitor has already been marked as exited',
          data: visitor 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update visitor is_exit flag
    const { data: updatedVisitor, error: updateError } = await supabase
      .from('visitors')
      .update({
        is_exit: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', visitor_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating visitor:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update visitor: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Visitor marked as exited successfully',
        data: updatedVisitor 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in visitor-exist:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

