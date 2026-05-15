import { inngest } from "../client.js";
import { createClient } from "@supabase/supabase-js";
import { generateAndStoreReportForClient } from "../../report/generateReport.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthYear(month: number, year: number): string {
  const name = MONTH_NAMES[Math.max(0, month - 1)] ?? "Jan";
  return `${name}'${String(year).slice(-2)}`;
}

function formatMonthYearFull(month: number, year: number): string {
  const name = MONTH_NAMES[Math.max(0, month - 1)] ?? "Jan";
  return `${name} ${year}`;
}

function buildReportDownloadUrl(supabaseUrl: string, storagePath: string): string {
  const base = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/monthly_export`;
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
<li><strong>SOP</strong></li>
<li><strong>Student Well-Being</strong></li>
<li><strong>Committee</strong></li>
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

export const monthlyReportGenerate = inngest.createFunction(
  {
    id: "monthly-report-generate",
    name: "Generate Monthly Compliance Report",
    retries: 2,
    timeouts: { finish: "600s" }, // 10 minutes
  },
  { event: "monthly-report/generate" },
  async ({ event, step }) => {
    const {
      queue_id,
      client_id,
      target_employee_id,
      target_date,
      target_month,
      target_year,
    } = event.data as {
      queue_id: string;
      client_id: string;
      target_employee_id: string;
      target_date: number;
      target_month: number;
      target_year: number;
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const failQueue = async (reason: string) => {
      await supabase.rpc("monthly_export_queue_fail", {
        p_queue_id: queue_id,
        p_reason: reason,
        p_target_date: target_date,
        p_target_month: target_month,
        p_target_year: target_year,
      });
    };

    const [{ data: client }, { data: employee }] = await Promise.all([
      supabase.from("clients").select("name").eq("id", client_id).single(),
      supabase.from("employees").select("email, first_name, last_name").eq("id", target_employee_id).single(),
    ]);

    const clientName = client?.name ?? "Team";
    const recipientEmail = employee?.email ?? "";
    const recipientName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ").trim() || "there";

    if (!recipientEmail) {
      await failQueue("Super admin employee has no email");
      throw new Error("Super admin employee has no email");
    }

    let path: string;
    try {
      const result = await step.run("generate-pdf", async () => {
        return generateAndStoreReportForClient(supabase, client_id, target_year, target_month);
      });
      path = result.path;
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      await failQueue(reason);
      throw err;
    }

    const reportUrl = buildReportDownloadUrl(supabaseUrl, path);
    const subject = `Monthly Compliance Report – ${clientName} | ${formatMonthYearFull(target_month, target_year)}`;
    const body = buildMonthlyReportEmailBody({
      clientName,
      monthLabel: formatMonthYear(target_month, target_year),
      reportUrl,
    });

    await step.run("complete-queue", async () => {
      await supabase.rpc("monthly_export_queue_complete", {
        p_queue_id: queue_id,
        p_document_path: path,
        p_recipient_email: recipientEmail,
        p_recipient_name: recipientName,
        p_subject: subject,
        p_body: body,
        p_target_date: target_date,
        p_target_month: target_month,
        p_target_year: target_year,
      });
      return { ok: true };
    });

    return { path, clientId: client_id };
  }
);
