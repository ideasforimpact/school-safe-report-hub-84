
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );
    
    // Parse request body
    const { employeeId, clientId } = await req.json();
    
    // Validate input
    if (!employeeId || !clientId) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Employee ID and Client ID are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Validating employee ${employeeId} for client ${clientId}`);
    
    // First check if client exists and is active
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, active')
      .eq('id', clientId)
      .single();
    
    if (clientError || !client) {
      console.log(`Client validation failed: ${clientError?.message || 'Client not found'}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Client not found or inactive' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!client.active) {
      console.log('Client is not active');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Client is not active' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Then check if employee exists and is active
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, status, client_id')
      .eq('id', employeeId)
      .eq('client_id', clientId)
      .single();
    
    if (employeeError || !employee) {
      console.log(`Employee validation failed: ${employeeError?.message || 'Employee not found'}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Employee not found' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!employee.status) {
      console.log('Employee is not active');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Employee is not active' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // If both client and employee are active, return success
    console.log('Employee validation successful');
    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Employee validation successful' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in validate-employee function:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: 'Internal server error',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
