
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  // Create a Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  
  try {
    console.log("Initializing incident reference data");
    
    // Initialize incident statuses if they don't exist
    const { data: statusData, error: statusError } = await supabaseClient
      .from('incident_status')
      .select('id, name');
    
    if (statusError) {
      throw new Error(`Error checking incident statuses: ${statusError.message}`);
    }
    
    if (!statusData || statusData.length === 0) {
      await supabaseClient.from('incident_status').insert([
        { name: 'New', description: 'Newly reported incident' },
        { name: 'Open', description: 'Incident is being investigated' },
        { name: 'In Progress', description: 'Incident is being addressed' },
        { name: 'Closed', description: 'Incident has been resolved' },
        { name: 'On Hold', description: 'Investigation is temporarily paused' }
      ]);
    } else {
      console.log("Incident statuses already exist");
    }
    
    // Initialize incident report types if they don't exist
    const { data: reportTypeData, error: reportTypeError } = await supabaseClient
      .from('incident_report_types')
      .select('id, name');
    
    if (reportTypeError) {
      throw new Error(`Error checking incident report types: ${reportTypeError.message}`);
    }
    
    if (!reportTypeData || reportTypeData.length === 0) {
      await supabaseClient.from('incident_report_types').insert([
        { name: 'Incident', description: 'Safety incident report' },
        { name: 'Near Miss', description: 'Near miss report' },
        { name: 'Unsafe Condition', description: 'Unsafe condition report' }
      ]);
    } else {
      console.log("Incident report types already exist");
    }
    
    // Initialize incident categories if they don't exist
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from('incident_categories')
      .select('id, name')
      .eq('name', 'Other');
    
    if (categoryError) {
      throw new Error(`Error checking incident categories: ${categoryError.message}`);
    }
    
    // Ensure "Other" category exists, create if not
    if (!categoryData || categoryData.length === 0) {
      // Check if we have any categories
      const { data: allCategoryData, error: allCategoryError } = await supabaseClient
        .from('incident_categories')
        .select('id, name');
      
      if (allCategoryError) {
        throw new Error(`Error checking all categories: ${allCategoryError.message}`);
      }
      
      // Create categories if none exist
      if (!allCategoryData || allCategoryData.length === 0) {
        await supabaseClient.from('incident_categories').insert([
          { name: 'Physical Injury', description: 'Physical injury incidents', is_active: true },
          { name: 'Bullying', description: 'Bullying incidents', is_active: true },
          { name: 'Tech Misuse', description: 'Technology misuse incidents', is_active: true },
          { name: 'Property Damage', description: 'Property damage incidents', is_active: true },
          { name: 'Health Concern', description: 'Health-related incidents', is_active: true },
          { name: 'Security Breach', description: 'Security breach incidents', is_active: true },
          { name: 'Other', description: 'Other incidents', is_active: true }
        ]);
      } else {
        // Add "Other" category if it doesn't exist
        await supabaseClient.from('incident_categories').insert([
          { name: 'Other', description: 'Other incidents', is_active: true }
        ]);
      }
    } else {
      console.log("Incident categories already exist");
    }
    
    // Initialize incident priorities if they don't exist
    const { data: priorityData, error: priorityError } = await supabaseClient
      .from('incident_priorities')
      .select('id, name');
    
    if (priorityError) {
      throw new Error(`Error checking incident priorities: ${priorityError.message}`);
    }
    
    if (!priorityData || priorityData.length === 0) {
      await supabaseClient.from('incident_priorities').insert([
        { name: 'Low', description: 'Low priority', weight: 1, color: '#22c55e', is_active: true },
        { name: 'Medium', description: 'Medium priority', weight: 2, color: '#fbbf24', is_active: true },
        { name: 'High', description: 'High priority', weight: 3, color: '#f97316', is_active: true },
        { name: 'Critical', description: 'Critical priority', weight: 4, color: '#dc2626', is_active: true }
      ]);
    } else {
      console.log("Incident priorities already exist");
    }
    
    return new Response(JSON.stringify({ 
      message: "Reference data initialization complete",
      statusCount: statusData?.length || 0,
      typeCount: reportTypeData?.length || 0,
      categoryCount: categoryData?.length || 0,
      priorityCount: priorityData?.length || 0
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });
  } catch (error) {
    console.error("Error initializing reference data:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
});
