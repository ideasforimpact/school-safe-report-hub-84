import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Reuse the same auth helper pattern as visitor-management
async function getAuthenticatedUserInfo(req: Request, supabase: any): Promise<{
  employeeId: string;
  clientId: string;
  error?: Response;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Authorization header with Bearer token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const token = authHeader.substring(7);

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (_error) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const employeeId = payload.sub;

  // Try client_id from token first
  let clientId = payload.client_id || payload.clientId || null;

  // Fallback: load from employees table
  if (!clientId) {
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
        ),
      };
    }

    if (!employee.status) {
      return {
        employeeId: '',
        clientId: '',
        error: new Response(
          JSON.stringify({ error: 'Employee account is inactive' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        ),
      };
    }

    clientId = employee.client_id;
  }

  if (!clientId) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Client ID not found in token or employee record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return {
    employeeId,
    clientId,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Authenticate and get client/employee
    const authInfo = await getAuthenticatedUserInfo(req, supabase);
    if (authInfo.error) {
      return authInfo.error;
    }

    const clientId = authInfo.clientId;
    const employeeId = authInfo.employeeId;

    // Fetch trusted vehicles for this client and employee
    const { data, error } = await supabase
      .from('trusted_vehicle')
      .select('*')
      .eq('client_id', clientId)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trusted vehicles:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: data || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in get-trusted-vehicles:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


