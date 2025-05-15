
// Edge function for initializing incident data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the admin key for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Initializing incident reference data");

    // Create status values if they don't exist
    await initializeStatusValues(supabase);
    
    // Create incident report types if they don't exist
    await initializeReportTypes(supabase);
    
    // Create incident categories if they don't exist
    await initializeCategories(supabase);
    
    // Create incident priorities if they don't exist
    await initializePriorities(supabase);

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({ success: true, message: "Reference data initialized successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error initializing reference data:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper functions for initialization

async function initializeStatusValues(supabase) {
  // Check if status values exist
  const { data: existingStatus, error: checkError } = await supabase
    .from("incident_status")
    .select("id, name")
    .limit(1);
    
  if (checkError) {
    console.error("Error checking incident status:", checkError);
    throw new Error(`Failed to check incident status: ${checkError.message}`);
  }
  
  if (existingStatus && existingStatus.length > 0) {
    console.log("Incident statuses already exist");
    return;
  }
  
  // Create status values
  const statusValues = [
    { name: "New", description: "Newly reported incident" },
    { name: "Open", description: "Incident is open and needs attention" },
    { name: "In Progress", description: "Incident is being worked on" },
    { name: "On Hold", description: "Incident is temporarily on hold" },
    { name: "Closed", description: "Incident has been resolved and closed" }
  ];
  
  try {
    for (const status of statusValues) {
      const { error } = await supabase
        .from("incident_status")
        .insert([status]);
      
      if (error) {
        console.error(`Error creating status ${status.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error creating incident status values:", error);
    throw new Error(`Failed to create incident status values: ${error.message}`);
  }
}

async function initializeReportTypes(supabase) {
  // Check if report types exist
  const { data: existingTypes, error: checkError } = await supabase
    .from("incident_report_types")
    .select("id, name")
    .limit(1);
    
  if (checkError) {
    console.error("Error checking incident report types:", checkError);
    throw new Error(`Failed to check incident report types: ${checkError.message}`);
  }
  
  if (existingTypes && existingTypes.length > 0) {
    console.log("Incident report types already exist");
    return;
  }
  
  // Create report types
  const types = [
    { name: "Incident", description: "A safety incident that occurred" },
    { name: "Near Miss", description: "An event that could have resulted in an incident" },
    { name: "Unsafe Condition", description: "A condition that may lead to an incident" }
  ];
  
  try {
    for (const type of types) {
      const { data, error } = await supabase
        .from("incident_report_types")
        .insert([type])
        .select();
      
      if (error) {
        console.error(`Error creating incident type ${type.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error creating incident report types:", error);
    throw new Error(`Failed to create incident report types: ${error.message}`);
  }
}

async function initializeCategories(supabase) {
  // Check if categories exist
  const { data: existingCategories, error: checkError } = await supabase
    .from("incident_categories")
    .select("id, name")
    .limit(1);
    
  if (checkError) {
    console.error("Error checking incident categories:", checkError);
    throw new Error(`Failed to check incident categories: ${checkError.message}`);
  }
  
  if (existingCategories && existingCategories.length > 0) {
    console.log("Incident categories already exist");
    return;
  }
  
  // Create categories
  const categories = [
    { name: "Physical Injury", description: "Incidents resulting in physical harm" },
    { name: "Bullying", description: "Incidents related to bullying behavior" },
    { name: "Tech Misuse", description: "Incidents involving technology misuse" },
    { name: "Property Damage", description: "Damage to school or personal property" },
    { name: "Health Concern", description: "Health-related incidents" },
    { name: "Security Breach", description: "Security-related incidents" },
    { name: "Other", description: "Other incidents not fitting defined categories" }
  ];
  
  try {
    for (const category of categories) {
      const { data, error } = await supabase
        .from("incident_categories")
        .insert([category])
        .select();
      
      if (error) {
        console.error(`Error creating category ${category.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error creating incident categories:", error);
    throw new Error(`Failed to create incident categories: ${error.message}`);
  }
}

async function initializePriorities(supabase) {
  // Check if priorities exist
  const { data: existingPriorities, error: checkError } = await supabase
    .from("incident_priorities")
    .select("id, name")
    .limit(1);
    
  if (checkError) {
    console.error("Error checking incident priorities:", checkError);
    throw new Error(`Failed to check incident priorities: ${checkError.message}`);
  }
  
  if (existingPriorities && existingPriorities.length > 0) {
    console.log("Incident priorities already exist");
    return;
  }
  
  // Create priorities
  const priorities = [
    { name: "Low", description: "Low priority incident", weight: 1, color: "#22c55e" },
    { name: "Medium", description: "Medium priority incident", weight: 2, color: "#fbbf24" },
    { name: "High", description: "High priority incident", weight: 3, color: "#f97316" },
    { name: "Critical", description: "Critical priority incident", weight: 4, color: "#dc2626" }
  ];
  
  try {
    for (const priority of priorities) {
      const { data, error } = await supabase
        .from("incident_priorities")
        .insert([priority])
        .select();
      
      if (error) {
        console.error(`Error creating priority ${priority.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error creating incident priorities:", error);
    throw new Error(`Failed to create incident priorities: ${error.message}`);
  }
}
