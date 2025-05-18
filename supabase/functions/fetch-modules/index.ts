
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

    // Parse request parameters
    const { level } = await req.json();
    
    // Query the modules table
    let query = supabase.from('modules').select('*');
    
    if (level === 'backoffice') {
      // For backoffice users, fetch modules with level = 'backoffice'
      query = query.eq('level', 'backoffice');
    } else {
      // For client users, fetch modules with level != 'backoffice'
      query = query.neq('level', 'backoffice');
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Return the modules data
    return new Response(
      JSON.stringify({ 
        modules: data || [],
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
