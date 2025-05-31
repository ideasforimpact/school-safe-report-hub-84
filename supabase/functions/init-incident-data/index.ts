
// Follow the Deno deploy runtime compatibility
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exposed by default
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the function
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    console.log("Initializing incident reference data...");

    // First, initialize the status values if they don't exist
    const statusValues = ["New", "Open", "In Progress", "Closed", "On Hold"];
    const newStatusId = await ensureStatuses(supabaseClient, statusValues);
    
    // Initialize report types
    await ensureReportTypes(supabaseClient);
    
    // Initialize categories
    await ensureCategories(supabaseClient);
    
    // Initialize priorities
    await ensurePriorities(supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Incident reference data initialized successfully",
        newStatusId: newStatusId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function ensureStatuses(supabaseClient, statusValues) {
  console.log("Ensuring incident statuses exist...");
  
  // Check if we have the "New" status
  const { data: newStatus, error: newStatusError } = await supabaseClient
    .from("incident_status")
    .select("*")
    .eq("name", "New")
    .maybeSingle();
    
  let newStatusId = null;
    
  if (newStatusError) {
    console.error("Error checking for New status:", newStatusError);
  } else if (newStatus) {
    console.log("New status exists:", newStatus);
    newStatusId = newStatus.id;
  } else {
    // Create the New status with a specific UUID
    const newId = crypto.randomUUID();
    const { data, error } = await supabaseClient
      .from("incident_status")
      .insert({ 
        id: newId,
        name: "New", 
        description: "Incident has been reported but not yet reviewed" 
      })
      .select();
      
    if (error) {
      console.error("Error creating New status:", error);
    } else {
      console.log("Created New status:", data[0]);
      newStatusId = newId;
    }
  }
  
  // Add the rest of the statuses
  for (const status of statusValues) {
    if (status === "New") continue; // Skip New as we handled it above
    
    const { data, error } = await supabaseClient
      .from("incident_status")
      .select("*")
      .eq("name", status)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${status} status:`, error);
    } else if (!data) {
      // Status doesn't exist, create it
      const { error: insertError } = await supabaseClient
        .from("incident_status")
        .insert({ 
          name: status, 
          description: `Incident is in ${status} status` 
        });
        
      if (insertError) {
        console.error(`Error creating ${status} status:`, insertError);
      } else {
        console.log(`Created ${status} status`);
      }
    }
  }
  
  return newStatusId;
}

async function ensureReportTypes(supabaseClient) {
  console.log("Ensuring report types exist...");
  
  const reportTypes = [
    { name: "Incident", description: "A safety-related event that occurred" },
    { name: "Near Miss", description: "A potential incident that was avoided" },
    { name: "Unsafe Condition", description: "A condition that could lead to an incident" }
  ];
  
  for (const type of reportTypes) {
    const { data, error } = await supabaseClient
      .from("incident_report_types")
      .select("*")
      .eq("name", type.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${type.name} type:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_report_types")
        .insert(type);
        
      if (insertError) {
        console.error(`Error creating ${type.name} type:`, insertError);
      } else {
        console.log(`Created ${type.name} type`);
      }
    }
  }
}

async function ensureCategories(supabaseClient) {
  console.log("Ensuring incident categories exist...");
  
  const categories = [
    { name: "Physical Injury", description: "Incidents resulting in physical harm" },
    { name: "Bullying", description: "Incidents involving bullying or harassment" },
    { name: "Tech Misuse", description: "Misuse of technology resources" },
    { name: "Property Damage", description: "Damage to school property or equipment" },
    { name: "Health Concern", description: "Non-injury health related concerns" },
    { name: "Security Breach", description: "Security violations or breaches" },
    { name: "Other", description: "Other incidents not fitting above categories" }
  ];
  
  for (const category of categories) {
    const { data, error } = await supabaseClient
      .from("incident_categories")
      .select("*")
      .eq("name", category.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${category.name} category:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_categories")
        .insert(category);
        
      if (insertError) {
        console.error(`Error creating ${category.name} category:`, insertError);
      } else {
        console.log(`Created ${category.name} category`);
      }
    }
  }
}

async function ensurePriorities(supabaseClient) {
  console.log("Ensuring incident priorities exist...");
  
  const priorities = [
    { name: "Low", description: "Minor issue, address when convenient", weight: 1, color: "#22C55E" },
    { name: "Medium", description: "Important issue requiring attention", weight: 2, color: "#EAB308" },
    { name: "High", description: "Urgent issue requiring immediate attention", weight: 3, color: "#EF4444" },
    { name: "Critical", description: "Emergency situation requiring immediate response", weight: 4, color: "#7F1D1D" }
  ];
  
  for (const priority of priorities) {
    const { data, error } = await supabaseClient
      .from("incident_priorities")
      .select("*")
      .eq("name", priority.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${priority.name} priority:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_priorities")
        .insert(priority);
        
      if (insertError) {
        console.error(`Error creating ${priority.name} priority:`, insertError);
      } else {
        console.log(`Created ${priority.name} priority`);
      }
    }
  }
}
