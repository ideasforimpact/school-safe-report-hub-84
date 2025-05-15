
// supabase/functions/init-incident-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Initializing incident reference data...");

    // Step 1: Initialize incident statuses
    const statuses = [
      { name: "New", description: "Incident has been reported but not yet reviewed" },
      { name: "Open", description: "Incident has been reviewed and is being addressed" },
      { name: "In Progress", description: "Work is underway to resolve the incident" },
      { name: "On Hold", description: "Resolution is temporarily paused" },
      { name: "Closed", description: "Incident has been resolved and closed" }
    ];

    const { data: existingStatuses, error: statusCheckError } = await supabaseClient
      .from("incident_status")
      .select("name")
      .limit(1);

    if (statusCheckError) {
      throw new Error(`Error checking incident statuses: ${statusCheckError.message}`);
    }

    // Only insert if no statuses exist
    if (!existingStatuses || existingStatuses.length === 0) {
      console.log("Initializing incident statuses...");
      const { error: statusError } = await supabaseClient
        .from("incident_status")
        .insert(statuses);

      if (statusError) {
        throw new Error(`Error initializing incident statuses: ${statusError.message}`);
      }
    }

    // Step 2: Initialize incident report types
    const reportTypes = [
      { name: "Incident", description: "An event that has occurred and requires attention" },
      { name: "Near Miss", description: "An event that could have resulted in an incident but did not" },
      { name: "Unsafe Condition", description: "A condition that could lead to an incident if not addressed" }
    ];

    const { data: existingReportTypes, error: reportTypeCheckError } = await supabaseClient
      .from("incident_report_types")
      .select("name")
      .limit(1);

    if (reportTypeCheckError) {
      throw new Error(`Error checking report types: ${reportTypeCheckError.message}`);
    }

    // Only insert if no report types exist
    if (!existingReportTypes || existingReportTypes.length === 0) {
      console.log("Initializing incident report types...");
      const { error: reportTypeError } = await supabaseClient
        .from("incident_report_types")
        .insert(reportTypes);

      if (reportTypeError) {
        throw new Error(`Error initializing incident report types: ${reportTypeError.message}`);
      }
    }

    // Step 3: Initialize incident categories
    const categories = [
      { name: "Physical Injury", description: "Incidents resulting in physical harm" },
      { name: "Bullying", description: "Incidents involving bullying or harassment" },
      { name: "Tech Misuse", description: "Inappropriate use of technology" },
      { name: "Property Damage", description: "Damage to school property or equipment" },
      { name: "Health Concern", description: "Issues related to health and wellness" },
      { name: "Security Breach", description: "Security violations or unauthorized access" },
      { name: "Other", description: "Incidents that don't fit other categories" }
    ];

    const { data: existingCategories, error: categoryCheckError } = await supabaseClient
      .from("incident_categories")
      .select("id, name");

    if (categoryCheckError) {
      throw new Error(`Error checking incident categories: ${categoryCheckError.message}`);
    }

    // Check for "Other" category - it's critical
    const otherCategory = existingCategories?.find(cat => cat.name === "Other");
    
    if (!otherCategory) {
      console.log("Adding 'Other' category...");
      const otherCat = categories.find(c => c.name === "Other");
      if (otherCat) {
        const { data: insertedOther, error: otherError } = await supabaseClient
          .from("incident_categories")
          .insert(otherCat)
          .select();

        if (otherError) {
          throw new Error(`Error adding 'Other' category: ${otherError.message}`);
        }
      }
    }

    // Add any missing base categories
    for (const category of categories) {
      const exists = existingCategories?.some(c => c.name === category.name);
      if (!exists) {
        console.log(`Adding missing category: ${category.name}`);
        const { error: categoryError } = await supabaseClient
          .from("incident_categories")
          .insert(category);

        if (categoryError) {
          console.error(`Error adding category ${category.name}: ${categoryError.message}`);
        }
      }
    }

    // Step 4: Initialize priorities
    const priorities = [
      { name: "Low", description: "Minimal impact, can be addressed routinely", color: "green", weight: 1 },
      { name: "Medium", description: "Moderate impact, needs attention soon", color: "yellow", weight: 2 },
      { name: "High", description: "Significant impact, requires prompt attention", color: "orange", weight: 3 },
      { name: "Critical", description: "Severe impact, needs immediate action", color: "red", weight: 4 }
    ];

    const { data: existingPriorities, error: priorityCheckError } = await supabaseClient
      .from("incident_priorities")
      .select("name")
      .limit(1);

    if (priorityCheckError) {
      throw new Error(`Error checking incident priorities: ${priorityCheckError.message}`);
    }

    // Only insert if no priorities exist
    if (!existingPriorities || existingPriorities.length === 0) {
      console.log("Initializing incident priorities...");
      const { error: priorityError } = await supabaseClient
        .from("incident_priorities")
        .insert(priorities);

      if (priorityError) {
        throw new Error(`Error initializing incident priorities: ${priorityError.message}`);
      }
    }

    // Step 5: Initialize common subcategories
    // First get all category IDs
    const { data: allCategories, error: allCategoriesError } = await supabaseClient
      .from("incident_categories")
      .select("id, name");

    if (allCategoriesError) {
      throw new Error(`Error fetching all categories: ${allCategoriesError.message}`);
    }

    // For each category, add some default subcategories if none exist
    for (const category of allCategories || []) {
      // Check if subcategories exist for this category
      const { data: existingSubcategories, error: subcatCheckError } = await supabaseClient
        .from("incident_subcategories")
        .select("id")
        .eq("category_id", category.id)
        .limit(1);

      if (subcatCheckError) {
        console.error(`Error checking subcategories for ${category.name}: ${subcatCheckError.message}`);
        continue;
      }

      // If no subcategories exist for this category, add some defaults
      if (!existingSubcategories || existingSubcategories.length === 0) {
        let subcategoriesToAdd = [];
        
        // Define subcategories based on category
        switch (category.name) {
          case "Physical Injury":
            subcategoriesToAdd = [
              "Cuts and Bruises",
              "Broken Bones",
              "Head Injury",
              "Sport Injury",
              "Burns",
              "Allergic Reaction",
              "Other"
            ];
            break;
            
          case "Bullying":
            subcategoriesToAdd = [
              "Verbal Bullying",
              "Physical Bullying",
              "Cyberbullying",
              "Social Exclusion",
              "Other"
            ];
            break;
            
          case "Tech Misuse":
            subcategoriesToAdd = [
              "Unauthorized Access",
              "Inappropriate Content",
              "Device Damage",
              "Software Misuse",
              "Other"
            ];
            break;
            
          case "Property Damage":
            subcategoriesToAdd = [
              "Classroom Damage",
              "Equipment Damage",
              "Vandalism",
              "Accidental Damage",
              "Other"
            ];
            break;
            
          case "Health Concern":
            subcategoriesToAdd = [
              "Illness",
              "Infectious Disease",
              "Allergic Reaction",
              "Mental Health",
              "Injury",
              "Other"
            ];
            break;
            
          case "Security Breach":
            subcategoriesToAdd = [
              "Unauthorized Entry",
              "Theft",
              "Data Breach",
              "Lost ID/Access Card",
              "Other"
            ];
            break;
            
          case "Other":
            subcategoriesToAdd = ["Other"];
            break;
        }
        
        // Add subcategories
        if (subcategoriesToAdd.length > 0) {
          const subcategoriesToInsert = subcategoriesToAdd.map(name => ({
            name,
            category_id: category.id
          }));
          
          console.log(`Adding ${subcategoriesToInsert.length} subcategories for ${category.name}...`);
          
          const { error: subcatError } = await supabaseClient
            .from("incident_subcategories")
            .insert(subcategoriesToInsert);

          if (subcatError) {
            console.error(`Error adding subcategories for ${category.name}: ${subcatError.message}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Incident reference data initialized successfully"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200
    });

  } catch (error) {
    console.error("Error initializing incident data:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to initialize incident data"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500
    });
  }
});
