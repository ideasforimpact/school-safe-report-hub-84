
// Follow Deno Deploy's ES modules compatible syntax
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function to validate employee
async function validateEmployee(clientId: string, employeeId: string) {
  try {
    console.log(`Validating employee: ${employeeId} for client: ${clientId}`);
    
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // First, check if the client exists and is active
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, active')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error("Client validation error:", clientError);
      return { valid: false, error: 'Invalid client' };
    }
    
    if (!client || !client.active) {
      console.error("Client not found or not active:", clientId);
      return { valid: false, error: 'Client is not active' };
    }
    
    // Then check if the employee exists, belongs to the client, and is active
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, status, client_id')
      .eq('id', employeeId)
      .single();
    
    if (employeeError) {
      console.error("Employee validation error:", employeeError);
      return { valid: false, error: 'Invalid employee' };
    }
    
    if (!employee) {
      console.error("Employee not found:", employeeId);
      return { valid: false, error: 'Employee not found' };
    }
    
    if (employee.client_id !== clientId) {
      console.error(`Employee ${employeeId} does not belong to client ${clientId}`);
      return { valid: false, error: 'Employee does not belong to this client' };
    }
    
    if (!employee.status) {
      console.error("Employee is not active:", employeeId);
      return { valid: false, error: 'Employee is not active' };
    }
    
    // If all checks pass, return success
    return { valid: true };
    
  } catch (error) {
    console.error("Error validating employee:", error);
    return { valid: false, error: 'Validation error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { clientId, employeeId } = await req.json();
    
    // Validate inputs
    if (!clientId || !employeeId) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate the employee
    const result = await validateEmployee(clientId, employeeId);
    
    if (!result.valid) {
      return new Response(
        JSON.stringify(result),
        { 
          status: 401, // Unauthorized
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ valid: true, message: 'Employee validated successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
