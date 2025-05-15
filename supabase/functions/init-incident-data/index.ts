
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! }
        }
      }
    );

    // Initialize incident types if they don't exist
    const reportTypes = [
      { name: "Incident", description: "A safety incident that has occurred" },
      { name: "Near Miss", description: "A potential incident that was avoided" },
      { name: "Unsafe Condition", description: "A condition that could lead to an incident" }
    ];
    
    for (const type of reportTypes) {
      const { error: typeError } = await supabaseClient
        .from('incident_report_types')
        .upsert({ 
          name: type.name, 
          description: type.description, 
          is_active: true
        }, { 
          onConflict: 'name'
        });
      
      if (typeError) {
        console.error(`Error creating incident type ${type.name}:`, typeError);
      }
    }

    // Initialize incident status types
    const statusTypes = [
      { name: "New", description: "Newly reported incident", color: "#3B82F6" }, // Blue
      { name: "Open", description: "Incident is open and being addressed", color: "#EF4444" }, // Red 
      { name: "Progress", description: "Incident is in progress", color: "#F59E0B" }, // Yellow
      { name: "OnHold", description: "Incident is on hold", color: "#FB923C" }, // Orange
      { name: "Closed", description: "Incident has been resolved and closed", color: "#10B981" } // Green
    ];
    
    for (const status of statusTypes) {
      const { error: statusError } = await supabaseClient
        .from('incident_status')
        .upsert({ 
          name: status.name, 
          description: status.description,
          color: status.color,
          is_active: true
        }, {
          onConflict: 'name'
        });
      
      if (statusError) {
        console.error(`Error creating status ${status.name}:`, statusError);
      }
    }

    // Initialize incident categories
    const categories = [
      { name: "Physical Injury", description: "Incidents involving physical harm or injury" },
      { name: "Bullying", description: "Incidents involving bullying or harassment" },
      { name: "Tech Misuse", description: "Incidents involving misuse of technology" },
      { name: "Property Damage", description: "Incidents involving damage to property" },
      { name: "Health Concern", description: "Incidents involving health concerns" },
      { name: "Security Breach", description: "Incidents involving security breaches" },
      { name: "Other", description: "Other types of incidents not covered by other categories" }
    ];
    
    for (const category of categories) {
      const { error: categoryError } = await supabaseClient
        .from('incident_categories')
        .upsert({
          name: category.name,
          description: category.description,
          is_active: true
        }, {
          onConflict: 'name'
        });
      
      if (categoryError) {
        console.error(`Error creating category ${category.name}:`, categoryError);
      }
    }

    // Initialize priorities
    const priorities = [
      { name: "Low", description: "Low priority incidents", weight: 1, color: "#10B981" },
      { name: "Medium", description: "Medium priority incidents", weight: 2, color: "#F59E0B" },
      { name: "High", description: "High priority incidents", weight: 3, color: "#EF4444" },
      { name: "Critical", description: "Critical priority incidents", weight: 4, color: "#7F1D1D" }
    ];
    
    for (const priority of priorities) {
      const { error: priorityError } = await supabaseClient
        .from('incident_priorities')
        .upsert({
          name: priority.name,
          description: priority.description,
          weight: priority.weight,
          color: priority.color,
          is_active: true
        }, {
          onConflict: 'name'
        });
      
      if (priorityError) {
        console.error(`Error creating priority ${priority.name}:`, priorityError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Incident reference data initialized successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
