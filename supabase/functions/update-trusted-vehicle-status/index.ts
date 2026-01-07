/**
 * Update Trusted Vehicle Status API
 * Updates entry_status for a trusted vehicle
 * Requires: trusted_vehicle_id, entry_status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

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
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      )
    };
  }

  if (!employee.status) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Employee account is inactive' }),
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      )
    };
  }

  if (!employee.client_id) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Employee does not have a client_id assigned' }),
        { status: 400, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      )
    };
  }

  return {
    employeeId: employee.id,
    clientId: employee.client_id
  };
}

serve(async (req) => {
  // Get CORS headers with origin support
  const corsHeadersWithOrigin = getCorsHeaders(req);
  
  // Handle CORS preflight - MUST return CORS headers
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

    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Only POST is supported.' }),
        { status: 405, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and verify token, get employee_id and client_id
    const authInfo = await getAuthenticatedUserInfo(req, supabase);
    if (authInfo.error) {
      // Ensure CORS headers are included in error response
      const errorResponse = authInfo.error;
      const errorHeaders = new Headers(errorResponse.headers);
      Object.entries(corsHeadersWithOrigin).forEach(([key, value]) => {
        errorHeaders.set(key, value);
      });
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        headers: errorHeaders
      });
    }

    const authenticatedEmployeeId = authInfo.employeeId;
    const authenticatedClientId = authInfo.clientId;

    // Note: IP whitelist validation is NOT required for this API as per requirements

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    const { trusted_vehicle_id, entry_status, exit_time } = body;

    // Validate required fields
    if (!trusted_vehicle_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: trusted_vehicle_id' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    if (entry_status === undefined || entry_status === null) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: entry_status' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Validate entry_status is a string (text type)
    if (typeof entry_status !== 'string') {
      return new Response(
        JSON.stringify({ error: 'entry_status must be a string (text)' }),
        { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: validate exit_time if provided (must be a valid date string)
    let parsedExitDate: Date | null = null;
    if (exit_time) {
      parsedExitDate = new Date(exit_time);
      if (isNaN(parsedExitDate.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid exit_time format. Expected a valid date string.' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if trusted vehicle exists and belongs to the authenticated client
    const { data: trustedVehicle, error: fetchError } = await supabase
      .from('trusted_vehicle')
      .select('id, client_id, entry_status')
      .eq('id', trusted_vehicle_id)
      .eq('client_id', authenticatedClientId)
      .single();

    if (fetchError || !trustedVehicle) {
      return new Response(
        JSON.stringify({ error: 'Trusted vehicle not found or access denied' }),
        { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // Update entry_status (and exit_time if provided)
    const updatePayload: any = {
      entry_status: entry_status,
      updated_at: new Date().toISOString()
    };

    if (parsedExitDate) {
      // Store only the date component for exit_time
      updatePayload.exit_time = parsedExitDate.toISOString().slice(0, 10);
    }

    const { data: updatedTrustedVehicle, error: updateError } = await supabase
      .from('trusted_vehicle')
      .update(updatePayload)
      .eq('id', trusted_vehicle_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trusted vehicle:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update trusted vehicle: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Trusted vehicle entry status updated successfully',
        data: updatedTrustedVehicle 
      }),
      { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-trusted-vehicle-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
});


