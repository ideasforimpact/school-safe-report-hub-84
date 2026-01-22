import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignSOPRequest {
  sop_id: string;
  client_id: string;
  employee_id: string;
  group_ids: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
    );

    const rawBody = await req.text();
    const requestData: AssignSOPRequest = JSON.parse(rawBody);
    const { sop_id, client_id, employee_id, group_ids } = requestData;

    // Basic validation
    if (!sop_id || !client_id || !employee_id || !group_ids || group_ids.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "sop_id, client_id, employee_id and at least one group_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate SOP belongs to client (or at least exists)
    const { data: sop, error: sopError } = await supabaseClient
      .from("sop")
      .select("id, client_id")
      .eq("id", sop_id)
      .single();

    if (sopError || !sop) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "Invalid SOP ID",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Optional: ensure SOP client matches provided client_id when not null
    if (sop.client_id && sop.client_id !== client_id) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "SOP does not belong to the specified client",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate groups belong to client and are active
    const { data: groups, error: groupsError } = await supabaseClient
      .from("groups")
      .select("id, name, group_type")
      .in("id", group_ids)
      .eq("client_id", client_id)
      .eq("status", true);

    if (groupsError) {
      console.error("Error fetching groups for assignment:", groupsError);
      return new Response(
        JSON.stringify({
          error: "Failed to validate groups",
          details: groupsError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!groups || groups.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: "No valid groups found for assignment",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const validGroupIds = groups.map((g) => g.id);

    // Remove ALL existing assignments for this SOP + client (reset, then re-insert selected groups)
    const { error: deleteError } = await supabaseClient
      .from("sop_assigned")
      .delete()
      .eq("sop_id", sop_id)
      .eq("client_id", client_id);

    if (deleteError) {
      console.error("Error deleting existing sop_assigned rows:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to update assignments",
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert new assignments
    const rowsToInsert = validGroupIds.map((groupId) => ({
      sop_id,
      client_id,
      group_id: groupId,
      employee_id: null,
      role_id: null,
      created_by: employee_id,
    }));

    const { error: insertError } = await supabaseClient
      .from("sop_assigned")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("Error inserting sop_assigned rows:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to create assignments",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build response: group information + involved employees (via groups -> group_employees -> employees)
    const { data: groupsWithEmployees, error: geError } = await supabaseClient
      .from("groups")
      .select(
        `
        id,
        name,
        group_type,
        group_employees (
          employee:employees!group_employees_employee_id_fkey (
          id,
          first_name,
          last_name,
          email
          )
        )
      `,
      )
      .eq("client_id", client_id)
      .in("id", validGroupIds);

    if (geError) {
      console.error("Error fetching group employees:", geError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch assigned employees",
          details: geError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build summary structure
    const groupsSummary =
      groupsWithEmployees?.map((g: any) => {
        const employees =
          g.group_employees
            ?.map((ge: any) => ge.employee)
        .filter(Boolean)
        .map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
          email: emp.email,
            })) ?? [];

      return {
        id: g.id,
        name: g.name,
        group_type: g.group_type,
        employees,
        employee_count: employees.length,
      };
      }) ?? [];

    const totalCount = groupsSummary.reduce(
      (sum, g) => sum + (g.employee_count ?? 0),
      0,
    );

    const responseBody = {
      success: true,
      assigned_summary: {
        groups: groupsSummary,
        total_count: totalCount,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in assign-sop function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});


