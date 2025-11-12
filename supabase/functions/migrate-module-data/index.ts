
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    console.log("Starting module data migration...");

    // 1. Fetch all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name');

    if (modulesError) {
      throw new Error(`Error fetching modules: ${modulesError.message}`);
    }

    console.log(`Found ${modules.length} modules`);

    // 2. Fetch all client_modules with module_key
    const { data: clientModules, error: clientModulesError } = await supabase
      .from('client_modules')
      .select('id, client_id, module_key, enabled');

    if (clientModulesError) {
      throw new Error(`Error fetching client_modules: ${clientModulesError.message}`);
    }

    console.log(`Found ${clientModules.length} client module entries to migrate`);

    // 3. Create a mapping between module_key and module_id
    // We'll try to match by converting module name to camelCase (similar to what the frontend does)
    const moduleMap = new Map();
    modules.forEach(module => {
      const normalizedName = module.name.toLowerCase()
        .replace(/\s(.)/g, ($1) => $1.toUpperCase())
        .replace(/\s/g, '')
        .replace(/^(.)/, ($1) => $1.toLowerCase());
      
      moduleMap.set(normalizedName, module.id);
      
      // Also set the raw module name as a key
      moduleMap.set(module.name, module.id);
    });

    console.log("Module mapping created");

    // 4. Update each client_module with the corresponding module_id
    let updatedCount = 0;
    let errorCount = 0;

    for (const clientModule of clientModules) {
      if (!clientModule.module_key) continue;
      
      // Try to find a matching module_id
      const moduleId = moduleMap.get(clientModule.module_key);
      
      if (!moduleId) {
        console.log(`No matching module found for key: ${clientModule.module_key}`);
        errorCount++;
        continue;
      }
      
      // Update the client_module record
      const { error: updateError } = await supabase
        .from('client_modules')
        .update({ 
          module_id: moduleId,
          access_level: { 
            isAdmin: clientModule.module_key.includes('Admin'),
            isEnabled: clientModule.enabled 
          }
        })
        .eq('id', clientModule.id);
      
      if (updateError) {
        console.error(`Error updating client_module ${clientModule.id}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Migration completed: ${updatedCount} records updated, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Migration completed: ${updatedCount} records updated, ${errorCount} errors` 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Error in migrate-module-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
