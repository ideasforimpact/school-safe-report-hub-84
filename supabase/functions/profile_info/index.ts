
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Parse request body
    const { employeeId, clientId } = await req.json();
    
    // Validate input
    if (!employeeId || !clientId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Employee ID and Client ID are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Fetching profile information for employee ${employeeId} from client ${clientId}`);
    
    // Get employee data
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('client_id', clientId)
      .single();
    
    if (employeeError) {
      console.error(`Error fetching employee data: ${employeeError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching employee data' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get client data
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error(`Error fetching client data: ${clientError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching client data' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get module access data
    const { data: moduleAccess, error: moduleError } = await supabaseAdmin
      .from('employee_modules')
      .select(`
        access_level,
        modules (
          id,
          name,
          level,
          icon
        )
      `)
      .eq('employee_id', employeeId);
    
    if (moduleError) {
      console.error(`Error fetching module data: ${moduleError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching module data' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Format the response
    const profileData = {
      employee: {
        ...employee,
        client_name: client?.name || 'Unknown Client'
      },
      modules: moduleAccess.map(item => ({
        id: item.modules?.id,
        name: item.modules?.name || 'Unknown Module',
        level: item.modules?.level,
        icon: item.modules?.icon,
        access_level: item.access_level || {}
      }))
    };
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: profileData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in profile_info function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
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
