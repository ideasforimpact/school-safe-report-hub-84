
// Edge function to enable realtime for tables
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
  
  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Enable full replica identity for the employee_documents table
    const { error: replicaError } = await supabase.rpc('set_replica_identity_for_table', { 
      table_name: 'employee_documents',
      identity_type: 'FULL'
    });
    
    if (replicaError) {
      console.error("Error setting replica identity:", replicaError);
      return new Response(
        JSON.stringify({ error: "Failed to set replica identity" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Add the table to the realtime publication
    const { error: pubError } = await supabase.rpc('add_table_to_publication', {
      table_name: 'employee_documents',
      publication_name: 'supabase_realtime'
    });
    
    if (pubError) {
      console.error("Error adding table to publication:", pubError);
      return new Response(
        JSON.stringify({ error: "Failed to add table to publication" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Realtime enabled for employee_documents table" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error enabling realtime:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
