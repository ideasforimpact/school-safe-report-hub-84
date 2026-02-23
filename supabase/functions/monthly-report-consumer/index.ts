import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey, getEnv } from "../_shared/env.ts";

// INNGEST_EVENT_URL = base only (e.g. https://inn.gs). Key goes in path /e/<key>.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

  try {
    const now = new Date();
    const prepareYear = now.getFullYear();
    const prepareMonth = now.getMonth() + 1;
    const prepareDate = now.getDate();

    // Select pending rows only (status IS NULL). Completed => is_queued true; error => is_queued false.
    const { data: rows, error: fetchError } = await supabase
      .from("monthly_export_queue")
      .select("id, client_id, target_employee_id, target_date, target_month, target_year")
      .eq("is_queued", true)
      .is("status", null)
      .eq("active", true)
      .eq("prepare_year", prepareYear)
      .eq("prepare_month", prepareMonth)
      .eq("prepare_date", prepareDate);

    if (fetchError) throw fetchError;
    if (!rows?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No queue rows to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;
    let failed = 0;

    console.log("[monthly-report-consumer] start", {
      totalRows: rows.length,
      prepareDate: `${prepareYear}-${String(prepareMonth).padStart(2, "0")}-${String(prepareDate).padStart(2, "0")}`,
    });

    for (const row of rows) {
      console.log("[monthly-report-consumer] processing queue row", {
        queueId: row.id,
        clientId: row.client_id,
        targetYear: row.target_year,
        targetMonth: row.target_month,
      });

      const [{ data: client }, { data: employee, error: empErr }] = await Promise.all([
        supabase.from("clients").select("name").eq("id", row.client_id).single(),
        supabase.from("employees").select("email, first_name, last_name").eq("id", row.target_employee_id).single(),
      ]);

      const clientName = client?.name ?? "Team";
      const recipientEmail = employee?.email ?? "";
      const recipientName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ").trim() || "there";

      if (!recipientEmail) {
        console.log("[monthly-report-consumer] skip client – no recipient email", {
          clientId: row.client_id,
          queueId: row.id,
        });
        await supabase.rpc("monthly_export_queue_fail", {
          p_queue_id: row.id,
          p_reason: "Super admin employee has no email",
          p_target_date: row.target_date,
          p_target_month: row.target_month,
          p_target_year: row.target_year,
        });
        failed++;
        continue;
      }

      try {
        // Send event to Inngest worker (worker generates PDF and calls complete/fail)
        const eventKey = getEnv("INNGEST_EVENT_KEY");
        if (!eventKey) {
          throw new Error("INNGEST_EVENT_KEY is not set. Add it in Supabase Edge Function secrets.");
        }

        const eventBaseUrl = getEnv("INNGEST_EVENT_URL", "https://inn.gs").replace(/\/$/, "");
        const eventUrl = `${eventBaseUrl}/e/${encodeURIComponent(eventKey)}`;
        const eventRes = await fetch(eventUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "monthly-report/generate",
            data: {
              queue_id: row.id,
              client_id: row.client_id,
              target_employee_id: row.target_employee_id,
              target_date: row.target_date,
              target_month: row.target_month,
              target_year: row.target_year,
            },
          }),
        });

        if (!eventRes.ok) {
          const errText = await eventRes.text();
          throw new Error(`Inngest event failed: ${eventRes.status} ${errText}`);
        }

        const eventResult = await eventRes.json() as { ids?: string[] };
        console.log("[monthly-report-consumer] event sent to Inngest", {
          clientId: row.client_id,
          queueId: row.id,
          eventIds: eventResult?.ids ?? [],
        });

        // Mark row as processing so next consumer run does not resend. Worker will set completed/failed.
        await supabase
          .from("monthly_export_queue")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", row.id);

        processed++;
        console.log("[monthly-report-consumer] enqueued client", {
          clientId: row.client_id,
          queueId: row.id,
        });
      } catch (err: any) {
        const reason = err?.message ?? String(err);
        console.log("[monthly-report-consumer] failed client", {
          clientId: row.client_id,
          queueId: row.id,
          reason,
        });
        await supabase.rpc("monthly_export_queue_fail", {
          p_queue_id: row.id,
          p_reason: reason,
          p_target_date: row.target_date,
          p_target_month: row.target_month,
          p_target_year: row.target_year,
        });
        failed++;
      }
    }

    console.log("[monthly-report-consumer] end", { processed, failed, total: rows.length });
    return new Response(
      JSON.stringify({ success: true, processed, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("monthly-report-consumer error", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
