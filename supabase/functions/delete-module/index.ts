import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handleDeleteModule(moduleId: string): Promise<Response> {
  try {
    console.log(`Starting module deletion process for module ID: ${moduleId}`);

    // Step 1: Delete all client_modules entries for this module
    console.log(`Deleting client_modules entries for module_id: ${moduleId}`);
    const { error: clientModulesError, count: clientModulesCount } = await supabase
      .from('client_modules')
      .delete()
      .eq('module_id', moduleId)
      .select('*', { count: 'exact', head: true });

    if (clientModulesError) {
      console.error(`Error deleting client_modules:`, clientModulesError);
      throw new Error(`Failed to delete client_modules: ${clientModulesError.message}`);
    }
    
    console.log(`Deleted ${clientModulesCount || 0} client_modules entries`);

    // Step 2: Delete all employee_modules entries for this module
    console.log(`Deleting employee_modules entries for module_id: ${moduleId}`);
    const { error: employeeModulesError, count: employeeModulesCount } = await supabase
      .from('employee_modules')
      .delete()
      .eq('module_id', moduleId)
      .select('*', { count: 'exact', head: true });

    if (employeeModulesError) {
      console.error(`Error deleting employee_modules:`, employeeModulesError);
      throw new Error(`Failed to delete employee_modules: ${employeeModulesError.message}`);
    }
    
    console.log(`Deleted ${employeeModulesCount || 0} employee_modules entries`);

    // Step 3: Delete the module itself
    console.log(`Deleting module with id: ${moduleId}`);
    const { error: moduleError } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (moduleError) {
      console.error(`Error deleting module:`, moduleError);
      throw new Error(`Failed to delete module: ${moduleError.message}`);
    }

    console.log(`Successfully deleted module ${moduleId} and all related entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Module deleted successfully',
        deletedClientModules: clientModulesCount || 0,
        deletedEmployeeModules: employeeModulesCount || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in handleDeleteModule:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to delete module'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Delete module request body:', requestBody);

    const { moduleId } = requestBody;

    if (!moduleId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'moduleId is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    return await handleDeleteModule(moduleId);
  } catch (error) {
    console.error('Error in delete-module function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

