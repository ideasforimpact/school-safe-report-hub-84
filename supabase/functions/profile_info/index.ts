
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
    
    // Fetch employee details
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, employee_type, department, is_super_admin, client_id')
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
    
    // Fetch client information
    let clientInfo = { name: 'Unknown', id: clientIdToUse || '' };
    if (clientIdToUse) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientIdToUse)
        .single();
      
      if (!clientError && clientData) {
        clientInfo = { name: clientData.name, id: clientData.id };
      } else {
        //console.log('Client not found or error:', clientError);
      }
    }
    
    // Fetch module access information
    let moduleAccess = [];
    const { data: employeeModules, error: modulesError } = await supabase
      .from('employee_modules')
      .select('module_id, access_level')
      .eq('employee_id', employee_id);
    
    if (modulesError) {
      console.error('Error fetching employee modules:', modulesError);
    } else if (employeeModules && employeeModules.length > 0) {
      // Get all module details for the employee
      const moduleIds = employeeModules.map(module => module.module_id);
      
      const { data: modulesData, error: moduleDetailsError } = await supabase
        .from('modules')
        .select('id, name')
        .in('id', moduleIds);
      
      if (!moduleDetailsError && modulesData) {
        // Create a map of module access levels
        const accessLevelsByModuleId = {};
        employeeModules.forEach(module => {
          if (module.module_id) {
            accessLevelsByModuleId[module.module_id] = module.access_level || {};
          }
        });
        
        // Map module details with access levels
        moduleAccess = modulesData.map(module => ({
          id: module.id,
          name: module.name,
          key: module.name.toLowerCase().replace(/\s+/g, '_'),
          access_level: accessLevelsByModuleId[module.id] || {}
        }));
      } else {
        console.error('Error fetching module details:', moduleDetailsError);
      }
    }
    
    // If the employee is a super admin, fetch all client modules too
    if (employeeData.is_super_admin === true && clientIdToUse) {
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select('module_id, access_level')
        .eq('client_id', clientIdToUse);
      
      if (!clientModulesError && clientModules && clientModules.length > 0) {
        const moduleIds = clientModules.map(module => module.module_id);
        
        // Get module details that are not already in the employee modules
        const existingModuleIds = moduleAccess.map(m => m.id);
        const newModuleIds = moduleIds.filter(id => !existingModuleIds.includes(id));
        
        if (newModuleIds.length > 0) {
          const { data: additionalModules, error: additionalModulesError } = await supabase
            .from('modules')
            .select('id, name')
            .in('id', newModuleIds);
          
          if (!additionalModulesError && additionalModules) {
            // Create a map of module access levels
            const accessLevelsByModuleId = {};
            clientModules.forEach(module => {
              if (module.module_id) {
                accessLevelsByModuleId[module.module_id] = module.access_level || {};
              }
            });
            
            // Add additional modules to the list
            const additionalModuleAccess = additionalModules.map(module => ({
              id: module.id,
              name: module.name,
              key: module.name.toLowerCase().replace(/\s+/g, '_'),
              access_level: { ...accessLevelsByModuleId[module.id], is_admin: true } // Super admins are admins for all modules
            }));
            
            moduleAccess = [...moduleAccess, ...additionalModuleAccess];
          }
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
