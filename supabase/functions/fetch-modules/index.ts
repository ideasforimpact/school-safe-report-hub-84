
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Parse request parameters - support both userInfo and explicit level request
    const requestBody = await req.json();
    const { userInfo, fetchLevel } = requestBody;
    
    // Log user details if provided
    if (userInfo) {
      console.log(`User requesting modules: ${JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        isSaasOwner: userInfo.isSaasOwner,
        provider: userInfo.provider || 'none'
      })}`);
    } else {
      console.log('No user info provided with module request');
    }
    
    // Determine level based on explicit request or user role
    let level;
    if (fetchLevel) {
      level = fetchLevel;
      console.log(`Explicit module level requested: ${level}`);
    } else {
      level = userInfo?.role === 'saas_owner' || userInfo?.isSaasOwner ? 'backoffice' : 'client';
      console.log(`Determined module level: ${level} based on user role`);
    }
    
    // If user is authenticated via provider, fetch only their configured modules
    let modules = [];
    
    if (userInfo?.provider && userInfo.id) {
      console.log(`User authenticated via ${userInfo.provider}, fetching configured modules`);
      
      // First, try to get employee ID from users table
      const { data: userData, error: userError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('user_id', userInfo.id)
        .single();
      
      if (userError) {
        console.error('Error finding employee:', userError);
      }
      
      if (userData) {
        console.log(`Found employee: ${userData.first_name} ${userData.last_name}`);
        
        // Fetch employee modules
        const { data: employeeModules, error: modulesError } = await supabase
          .from('employee_modules')
          .select('module_id, roles(id, key, name)')
          .eq('employee_id', userData.id);
        
        if (modulesError) {
          console.error('Error fetching employee modules:', modulesError);
        }
        
        if (employeeModules && employeeModules.length > 0) {
          console.log(`Found ${employeeModules.length} configured modules for employee`);
          
          // Create a list of module keys
          const moduleKeys = employeeModules.map(em => em.roles?.key || '');
          console.log('Module keys:', moduleKeys);
          
          // Get all modules and filter by level
          const { data: allModules, error: modulesQueryError } = await supabase
            .from('modules')
            .select('*');
            
          if (modulesQueryError) {
            console.error('Error fetching all modules:', modulesQueryError);
          }
          
          if (allModules) {
            // Map module names to permission keys
            allModules.forEach(module => {
              // Set key based on module name for permission mapping
              switch(module.name.toLowerCase()) {
                case 'incidents':
                  module.key = 'incidentReporting';
                  break;
                case 'assessments':
                  module.key = 'assessmentUser';
                  break;
                case 'employee verification':
                  module.key = 'employeeVerificationAdmin';
                  break;
                case 'grievances':
                  module.key = 'grievancesAdmin';
                  break;
                case 'transport safety':
                  module.key = 'transportSafetyAdmin';
                  break;
                case 'edusafe resources':
                  module.key = 'eduSafeResourceAccess';
                  break;
                default:
                  // For modules without specific permissions
                  module.key = module.name.toLowerCase().replace(/\s+/g, '_');
              }
            });
            
            // Filter modules based on level and permissions
            modules = allModules.filter(module => {
              // Match level
              if (level !== 'all' && module.level !== level) {
                return false;
              }
              
              // Always include dashboard
              if (module.name.toLowerCase() === 'dashboard') {
                return true;
              }
              
              // Include if module key is in the configured modules
              return module.key && moduleKeys.includes(module.key);
            });
            
            console.log(`Filtered to ${modules.length} modules for employee`);
          }
        } else {
          console.log('No configured modules found for employee, using default query');
        }
      } else {
        console.log('No employee record found for user, using default query');
      }
    }
    
    // If we didn't get modules from employee configuration, use the standard query
    if (modules.length === 0) {
      // Query the modules table
      let query = supabase.from('modules').select('*');
      
      if (level === 'backoffice') {
        // For backoffice users, fetch modules with level = 'backoffice'
        console.log('Fetching backoffice modules');
        query = query.eq('level', 'backoffice');
      } else if (level === 'client') {
        // For client users, fetch modules with level != 'backoffice'
        console.log('Fetching client modules');
        query = query.neq('level', 'backoffice');
      } else if (level === 'all') {
        // Fetch all modules if explicitly requested
        console.log('Fetching all modules');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }
      
      modules = data || [];
    }
    
    console.log(`Successfully fetched ${modules.length} modules`);
    
    // Return the modules data
    return new Response(
      JSON.stringify({ 
        modules,
        success: true 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching modules:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
