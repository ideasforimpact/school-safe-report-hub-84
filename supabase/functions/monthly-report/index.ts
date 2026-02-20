import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function createServiceClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, active")
      .eq("active", true);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch clients" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientIds = (clients ?? []).map((c: { id: string }) => c.id);
    if (!clientIds.length) {
      return new Response(
        JSON.stringify({ success: false, error: "No active clients found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    const reportYear = now.getFullYear();
    const reportMonth = now.getMonth() + 1;
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    const prepareDate = now.getDate();
    const prepareMonth = now.getMonth() + 1;
    const prepareYear = now.getFullYear();

    for (const cid of clientIds) {
      const { data: superAdmin } = await supabase
        .from("employees")
        .select("id")
        .eq("client_id", cid)
        .eq("is_super_admin", true)
        .limit(1)
        .single();

      if (!superAdmin?.id) continue;

      const { data: existing } = await supabase
        .from("monthly_export_queue")
        .select("id")
        .eq("client_id", cid)
        .eq("target_employee_id", superAdmin.id)
        .eq("target_month", reportMonth)
        .eq("target_date", lastDay)
        .eq("target_year", reportYear)
        .limit(1)
        .maybeSingle();

      if (existing) continue;

      await supabase.from("monthly_export_queue").insert({
        client_id: cid,
        target_employee_id: superAdmin.id,
        target_month: reportMonth,
        target_date: lastDay,
        target_year: reportYear,
        prepare_month: prepareMonth,
        prepare_date: prepareDate,
        prepare_year: prepareYear,
        is_queued: true,
        error_queue_msg: null,
        retry_count: 0,
        max_retries: 2,
        active: true,
        status: null,
      });
    }

    try {
      await (supabase as any).functions.invoke("monthly-report-consumer", { body: {} });
    } catch (invokeErr) {
      console.error("Failed to trigger monthly-report-consumer:", invokeErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Enqueued and consumer invoked",
        year: reportYear,
        month: reportMonth,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("monthly-report error", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
