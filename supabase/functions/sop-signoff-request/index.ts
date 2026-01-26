import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignoffRequest {
  sop_id: string;
  client_id: string;
  employee_id: string;
  group_ids: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const requestData: SignoffRequest = await req.json();
    const { sop_id, client_id, employee_id, group_ids } = requestData;

    // Validate required fields
    if (!sop_id) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "SOP ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!client_id) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "Client ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!employee_id) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "Employee ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "At least one Group ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate that all group_ids are valid UUIDs
    const validGroupIds = group_ids.filter((id) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    });

    if (validGroupIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "No valid Group IDs provided",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if signoff request already exists for this employee and SOP
    const { data: existingRequests, error: checkError } = await supabaseClient
      .from("sop_signoff_request")
      .select("id")
      .eq("sop_id", sop_id)
      .eq("employee_id", employee_id)
      .eq("client_id", client_id);

    if (checkError) {
      console.error("Error checking existing signoff requests:", checkError);
      return new Response(
        JSON.stringify({
          error: "Failed to check existing signoff requests",
          details: checkError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingRequests && existingRequests.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Signoff request already exists",
          details: "You have already submitted a signoff request for this SOP",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create signoff request records for each group
    const completedDate = new Date().toISOString();
    const rowsToInsert = validGroupIds.map((groupId) => ({
      sop_id,
      client_id,
      employee_id,
      group_id: groupId,
      is_completed: true,
      completed_date: completedDate,
    }));

    const { data: insertedData, error: insertError } = await supabaseClient
      .from("sop_signoff_request")
      .insert(rowsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting signoff requests:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to create signoff requests",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Signoff request submitted successfully",
        data: {
          records_created: insertedData?.length || 0,
          completed_date: completedDate,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sop-signoff-request function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



