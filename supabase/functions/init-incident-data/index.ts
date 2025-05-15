
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("Initializing incident reference data");
    
    // Check if we already have incident statuses
    const { data: existingStatuses, error: statusCheckError } = await supabase
      .from("incident_status")
      .select("name")
      .limit(1);
    
    if (statusCheckError) {
      throw new Error(`Failed to check existing statuses: ${statusCheckError.message}`);
    }
    
    // If no statuses exist, create default ones
    if (!existingStatuses || existingStatuses.length === 0) {
      console.log("Creating default incident statuses");
      
      const { error: statusError } = await supabase
        .from("incident_status")
        .insert([
          { name: "New", description: "Newly reported incident" },
          { name: "In Progress", description: "Incident is being addressed" },
          { name: "On Hold", description: "Incident resolution is paused" },
          { name: "Closed", description: "Incident has been resolved" },
        ]);
        
      if (statusError) {
        throw new Error(`Failed to create incident statuses: ${statusError.message}`);
      }
    } else {
      console.log("Incident statuses already exist");
    }
    
    // Check if we have incident report types
    const { data: existingTypes, error: typesCheckError } = await supabase
      .from("incident_report_types")
      .select("name")
      .limit(1);
      
    if (typesCheckError) {
      throw new Error(`Failed to check existing incident types: ${typesCheckError.message}`);
    }
    
    // If no types exist, create default ones
    if (!existingTypes || existingTypes.length === 0) {
      console.log("Creating default incident report types");
      
      const { error: typeError } = await supabase
        .from("incident_report_types")
        .insert([
          { name: "Incident", description: "An actual incident that occurred" },
          { name: "Near Miss", description: "A potential incident that was avoided" },
          { name: "Unsafe Condition", description: "A situation that could lead to incidents" },
        ]);
        
      if (typeError) {
        throw new Error(`Failed to create incident types: ${typeError.message}`);
      }
    } else {
      console.log("Incident report types already exist");
    }
    
    // Check if we have incident categories
    const { data: existingCategories, error: categoriesCheckError } = await supabase
      .from("incident_categories")
      .select("name")
      .limit(1);
      
    if (categoriesCheckError) {
      throw new Error(`Failed to check existing incident categories: ${categoriesCheckError.message}`);
    }
    
    // If no categories exist, create default ones
    if (!existingCategories || existingCategories.length === 0) {
      console.log("Creating default incident categories");
      
      const { error: categoryError } = await supabase
        .from("incident_categories")
        .insert([
          { name: "Physical Injury", description: "Injuries to body" },
          { name: "Bullying", description: "Harmful behavior towards others" },
          { name: "Tech Misuse", description: "Technology misuse incidents" },
          { name: "Property Damage", description: "Damage to property" },
          { name: "Health Concern", description: "Health related issues" },
          { name: "Security Breach", description: "Security related incidents" },
          { name: "Other", description: "Miscellaneous incidents" },
        ]);
        
      if (categoryError) {
        throw new Error(`Failed to create incident categories: ${categoryError.message}`);
      }
    } else {
      console.log("Incident categories already exist");
    }
    
    // Check if we have incident priorities
    const { data: existingPriorities, error: prioritiesCheckError } = await supabase
      .from("incident_priorities")
      .select("name")
      .limit(1);
      
    if (prioritiesCheckError) {
      throw new Error(`Failed to check existing incident priorities: ${prioritiesCheckError.message}`);
    }
    
    // If no priorities exist, create default ones
    if (!existingPriorities || existingPriorities.length === 0) {
      console.log("Creating default incident priorities");
      
      const { error: priorityError } = await supabase
        .from("incident_priorities")
        .insert([
          { name: "Low", description: "Minimal impact", color: "#4CAF50", weight: 1 },
          { name: "Medium", description: "Moderate impact", color: "#FFC107", weight: 2 },
          { name: "High", description: "Significant impact", color: "#FF9800", weight: 3 },
          { name: "Critical", description: "Severe impact", color: "#F44336", weight: 4 },
        ]);
        
      if (priorityError) {
        throw new Error(`Failed to create incident priorities: ${priorityError.message}`);
      }
    } else {
      console.log("Incident priorities already exist");
    }

    return new Response(
      JSON.stringify({
        message: "Reference data initialized successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
