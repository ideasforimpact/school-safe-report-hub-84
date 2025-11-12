
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

// Define CORS headers for browser access
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
    // Create a Supabase client with the auth context of the function
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );
    
    // Parse request data
    const { employee_id, client_id } = await req.json();
    
    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch employee details with client information in a single query
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        employee_type, 
        department, 
        is_super_admin, 
        client_id,
        clients!inner(id, name)
      `)
      .eq('id', employee_id)
      .single();
    
    if (employeeError || !employeeData) {
      console.error('Error fetching employee details:', employeeError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch employee details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine which client ID to use
    const clientIdToUse = employeeData.client_id || client_id;
    
    // Extract client information from the joined data
    let clientInfo = { name: 'Unknown', id: clientIdToUse || '' };
    if (employeeData.clients) {
      clientInfo = { 
        name: employeeData.clients.name, 
        id: employeeData.clients.id 
      };
    }
    
    // Fetch module access information with module details in a single query
    let moduleAccess: Array<{
      id: string;
      name: string;
      key: string;
      access_level: any;
    }> = [];
    const { data: employeeModules, error: modulesError } = await supabase
      .from('employee_modules')
      .select(`
        module_id, 
        access_level,
        modules!inner(id, name)
      `)
      .eq('employee_id', employee_id);
    
    if (modulesError) {
      console.error('Error fetching employee modules:', modulesError);
    } else if (employeeModules && employeeModules.length > 0) {
      // Map module details with access levels directly from joined data
      moduleAccess = employeeModules.map(employeeModule => ({
        id: employeeModule.modules.id,
        name: employeeModule.modules.name,
        key: employeeModule.modules.name.toLowerCase().replace(/\s+/g, '_'),
        access_level: employeeModule.access_level || {}
      }));
    }
    
    // If the employee is a super admin, fetch all client modules with module details in a single query
    if (employeeData.is_super_admin === true && clientIdToUse) {
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select(`
          module_id, 
          access_level,
          modules!inner(id, name)
        `)
        .eq('client_id', clientIdToUse);
      
      if (!clientModulesError && clientModules && clientModules.length > 0) {
        // Get existing module IDs to avoid duplicates
        const existingModuleIds = moduleAccess.map(m => m.id);
        
        // Filter out modules that are already in employee modules
        const additionalModules = clientModules.filter(clientModule => 
          !existingModuleIds.includes(clientModule.modules.id)
        );
        
        if (additionalModules.length > 0) {
          // Add additional modules to the list
          const additionalModuleAccess = additionalModules.map(clientModule => ({
            id: clientModule.modules.id,
            name: clientModule.modules.name,
            key: clientModule.modules.name.toLowerCase().replace(/\s+/g, '_'),
            access_level: { ...clientModule.access_level, is_admin: true } // Super admins are admins for all modules
          }));
          
          moduleAccess = [...moduleAccess, ...additionalModuleAccess];
        }
      }
    }
    
    // Prepare and return the response
    const response = {
      employeeDetails: {
        id: employeeData.id,
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        email: employeeData.email,
        employeeType: employeeData.employee_type,
        department: employeeData.department,
        isSuperAdmin: employeeData.is_super_admin
      },
      clientInfo,
      moduleAccess
    };
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in profile_info function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
