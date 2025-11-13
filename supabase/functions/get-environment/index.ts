import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get the environment
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    console.log(`Environment requested: ${environment}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        environment: environment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in get-environment function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred while getting environment" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

