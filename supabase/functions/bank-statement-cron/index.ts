
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

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
    console.log("Bank Statement Cron Job: Starting execution");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the main bank-statement function with cronJob action
    const { data, error } = await supabase.functions.invoke('bank-statement', {
      body: { action: 'cronJob' }
    });
    
    if (error) {
      console.error("Error invoking bank-statement function:", error);
      return new Response(
        JSON.stringify({ error: "Failed to execute cron job", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Bank Statement Cron Job: Completed successfully", data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Bank statement cron job executed successfully",
        result: data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in bank statement cron job:", error);
    return new Response(
      JSON.stringify({ error: "Cron job execution failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
