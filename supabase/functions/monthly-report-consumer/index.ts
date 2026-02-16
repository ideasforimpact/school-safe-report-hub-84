import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey, getFrontendUrl } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildMonthlyReportEmailBody(recipientName: string, downloadUrl: string): string {
  return `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Monthly Compliance Report</h2>
</div>
<div style="text-align:left;">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>${recipientName || "there"}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">Please find your monthly compliance report ready for download.</p>
<div style="background-color:#dbeafe;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<p style="margin:6px 0;"><a href="${downloadUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Download Report</a></p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">If the button does not work, copy and paste this link into your browser:<br/><a href="${downloadUrl}" style="color:#3b82f6;word-break:break-all;">${downloadUrl}</a></p>
</div>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
  const siteUrl = getFrontendUrl();

  try {
    const now = new Date();
    const prepareYear = now.getFullYear();
    const prepareMonth = now.getMonth() + 1;
    const prepareDate = now.getDate();

    // Select pending rows only (status IS NULL). Completed => is_queued true; error => is_queued false.
    const { data: rows, error: fetchError } = await supabase
      .from("monthly_export_queue")
      .select("id, client_id, target_employee_id, target_year, target_month")
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

    for (const row of rows) {
      const { data: employee, error: empErr } = await supabase
        .from("employees")
        .select("email, first_name, last_name")
        .eq("id", row.target_employee_id)
        .single();

      const recipientEmail = employee?.email ?? "";
      const recipientName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ").trim() || "there";

      if (!recipientEmail) {
        await supabase.rpc("monthly_export_queue_fail", {
          p_queue_id: row.id,
          p_reason: "Super admin employee has no email",
        });
        failed++;
        continue;
      }

      try {
        const { data: reportRes, error: invokeErr } = await (supabase as any).functions.invoke("monthly-report", {
          body: { clientId: row.client_id, year: row.target_year, month: row.target_month },
        });

        if (invokeErr) throw invokeErr;
        const path = reportRes?.path as string | undefined;
        if (!path || !reportRes?.success) {
          throw new Error(reportRes?.error ?? "No path returned");
        }

        const downloadUrl = `${siteUrl}/monthly-report/auto-download?clientId=${row.client_id}`;
        const subject = "Monthly Compliance Report – Ready for Download";
        const body = buildMonthlyReportEmailBody(recipientName, downloadUrl);

        await supabase.rpc("monthly_export_queue_complete", {
          p_queue_id: row.id,
          p_document_path: path,
          p_recipient_email: recipientEmail,
          p_recipient_name: recipientName,
          p_subject: subject,
          p_body: body,
        });
        processed++;
      } catch (err: any) {
        const reason = err?.message ?? String(err);
        await supabase.rpc("monthly_export_queue_fail", {
          p_queue_id: row.id,
          p_reason: reason,
        });
        failed++;
      }
    }

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
