
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define the required reference data for incidents
interface ReferenceData {
  table: string;
  items: Array<{ name: string; description?: string; weight?: number; color?: string }>;
}

const referenceData: ReferenceData[] = [
  {
    table: "incident_status",
    items: [
      { name: "Open", description: "Incident has been reported but not yet assigned" },
      { name: "In Progress", description: "Incident is being worked on" },
      { name: "Closed", description: "Incident has been resolved" }
    ]
  },
  {
    table: "incident_report_types",
    items: [
      { name: "Incident", description: "An event that has occurred" },
      { name: "Near Miss", description: "An event that almost occurred" },
      { name: "Unsafe Condition", description: "A condition that could lead to an incident" }
    ]
  },
  {
    table: "incident_categories",
    items: [
      { name: "Physical Injury", description: "Any form of bodily harm" },
      { name: "Bullying", description: "Aggressive behavior that involves unwanted, negative actions" },
      { name: "Tech Misuse", description: "Improper use of technology" },
      { name: "Property Damage", description: "Damage to physical property" },
      { name: "Health Concern", description: "Issues related to health and wellness" },
      { name: "Security Breach", description: "Unauthorized access or information disclosure" },
      { name: "Other", description: "Other incidents not covered by existing categories" }
    ]
  },
  {
    table: "incident_priorities",
    items: [
      { name: "Low", description: "Low priority", weight: 1, color: "#4CAF50" },
      { name: "Medium", description: "Medium priority", weight: 2, color: "#FFC107" },
      { name: "High", description: "High priority", weight: 3, color: "#FF9800" },
      { name: "Critical", description: "Critical priority", weight: 4, color: "#F44336" }
    ]
  }
];

serve(async (req) => {
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process each reference data table
    const results = [];
    
    for (const data of referenceData) {
      console.log(`Processing ${data.table}`);
      
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabase
        .from("information_schema.tables")
        .select("*")
        .eq("table_name", data.table)
        .eq("table_schema", "public");
        
      if (tableError) {
        console.error(`Error checking table ${data.table}:`, tableError);
        results.push({ table: data.table, status: "error", error: tableError.message });
        continue;
      }
      
      // Skip if table doesn't exist
      if (!tableExists || tableExists.length === 0) {
        results.push({ table: data.table, status: "skipped", reason: "Table does not exist" });
        continue;
      }
      
      // Process each item
      for (const item of data.items) {
        // Check if item exists
        const { data: existingItems, error: existingError } = await supabase
          .from(data.table)
          .select("*")
          .eq("name", item.name);
          
        if (existingError) {
          console.error(`Error checking ${item.name} in ${data.table}:`, existingError);
          continue;
        }
        
        // If item doesn't exist, insert it
        if (!existingItems || existingItems.length === 0) {
          const { error: insertError } = await supabase
            .from(data.table)
            .insert(item);
            
          if (insertError) {
            console.error(`Error inserting ${item.name} in ${data.table}:`, insertError);
          } else {
            console.log(`Inserted ${item.name} in ${data.table}`);
          }
        } else {
          console.log(`${item.name} already exists in ${data.table}`);
        }
      }
      
      results.push({ table: data.table, status: "processed" });
    }

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
