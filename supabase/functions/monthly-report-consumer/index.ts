import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey, getEnv } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthYear(month: number, year: number): string {
  const name = MONTH_NAMES[Math.max(0, month - 1)] ?? "Jan";
  return `${name}'${String(year).slice(-2)}`;
}

function formatMonthYearFull(month: number, year: number): string {
  const name = MONTH_NAMES[Math.max(0, month - 1)] ?? "Jan";
  return `${name} ${year}`;
}

function buildReportDownloadUrl(storagePath: string): string {
  const base = `${getSupabaseUrl().replace(/\/$/, "")}/storage/v1/object/public/monthly_export`;
  const path = storagePath.replace(/^\//, "");
  return `${base}/${path}`;
}

function buildMonthlyReportEmailBody(opts: {
  clientName: string;
  monthLabel: string;
  reportUrl: string;
}): string {
  const { clientName, monthLabel, reportUrl } = opts;
  const downloadButton = reportUrl
    ? `<div style="text-align:center;margin:28px 0 32px 0;"><a href="${reportUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">&#8595; Download Report</a></div>`
    : "";
  return `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Monthly Compliance Report</h2>
</div>
<div style="text-align:left;">
<p style="margin:0 0 20px;font-size:16px;">Hi Team <strong>${clientName || "there"}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">Greetings from <strong>Safe School</strong>.</p>
<p style="margin:0 0 20px;font-size:16px;">Please find attached the Monthly Compliance Report, covering key safety, compliance, and operational metrics for the month - <strong>${monthLabel}</strong></p>
<p style="margin:0 0 20px;font-size:16px;">This report provides an overview of:</p>
<ul style="margin:0 0 20px;padding-left:24px;font-size:16px;">
<li><strong>Vehicle Safety</strong></li>
<li><strong>Employee Verification</strong></li>
<li><strong>Assessments</strong></li>
<li><strong>Incidents</strong></li>
<li><strong>Grievances</strong></li>
</ul>
<p style="margin:0 0 20px;font-size:16px;">This report provides a clear view of the overall compliance status and key safety activities for the month.</p>
<p style="margin:0 0 20px;font-size:16px;">If you have any questions or require clarification on any section of the report, please feel free to reach out to us.</p>
${downloadButton}
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Warm regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
}

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
        const { data: reportRes, error: invokeErr } = await (supabase as any).functions.invoke("monthly-report", {
          body: { clientId: row.client_id, year: row.target_year, month: row.target_month },
        });

        console.log("[monthly-report-consumer] reportRes per client", {
          clientId: row.client_id,
          queueId: row.id,
          success: reportRes?.success ?? false,
          path: reportRes?.path ?? null,
          error: reportRes?.error ?? null,
          invokeError: invokeErr ? String(invokeErr) : null,
        });

        if (invokeErr) throw invokeErr;
        const path = reportRes?.path as string | undefined;
        if (!path || !reportRes?.success) {
          throw new Error(reportRes?.error ?? "No path returned");
        }

        const reportUrl = buildReportDownloadUrl(path);
        const subject = `Monthly Compliance Report – ${clientName} | ${formatMonthYearFull(row.target_month, row.target_year)}`;
        const body = buildMonthlyReportEmailBody({
          clientName,
          monthLabel: formatMonthYear(row.target_month, row.target_year),
          reportUrl,
        });

        await supabase.rpc("monthly_export_queue_complete", {
          p_queue_id: row.id,
          p_document_path: path,
          p_recipient_email: recipientEmail,
          p_recipient_name: recipientName,
          p_subject: subject,
          p_body: body,
          p_target_date: row.target_date,
          p_target_month: row.target_month,
          p_target_year: row.target_year,
        });
        processed++;
        console.log("[monthly-report-consumer] completed client", {
          clientId: row.client_id,
          queueId: row.id,
          path,
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
