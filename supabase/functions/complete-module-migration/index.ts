
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

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
    // Create a Supabase client with service role key for admin operations
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    console.log("Checking if we can safely drop module_key column...");

    // 1. Count how many client_modules have module_id not set but have module_key
    const { count: unmappedCount, error: countError } = await supabase
      .from('client_modules')
      .select('id', { count: 'exact', head: true })
      .is('module_id', null)
      .not('module_key', 'is', null);

    if (countError) {
      throw new Error(`Error checking unmapped modules: ${countError.message}`);
    }

    console.log(`Found ${unmappedCount} client modules without module_id mapped`);

    // 2. If there are any unmapped records, don't proceed
    if (unmappedCount > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Cannot drop module_key column - ${unmappedCount} records are not yet migrated to module_id` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // 3. It's safe to drop the column - use SQL to drop it
    const { error: dropError } = await supabase
      .rpc('drop_module_key_column');

    if (dropError) {
      throw new Error(`Error dropping module_key column: ${dropError.message}`);
    }

    console.log("Successfully dropped module_key column!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully dropped module_key column" 
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in complete-module-migration function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
