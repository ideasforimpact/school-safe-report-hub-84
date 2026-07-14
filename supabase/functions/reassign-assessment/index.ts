import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, path, id, client-id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  try {
    let body: any = {};
    if (req.method !== "GET" && req.method !== "OPTIONS") {
      body = await req.json();
    }
    const clientIdForValidation = body.client_id || req.headers.get("client-id") || "";
    if (clientIdForValidation) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(supabaseClient, req, clientIdForValidation, url.pathname);
      if (!ipValidation.allowed) {
        return new Response(
          JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    return await handle(body);
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── handle ──────────────────────────────────────────────────────────────────

async function handle(body: any): Promise<Response> {
  const { assessment_id, client_id, assigned_to, assignee } = body;
  const base_url = Deno.env.get("SITE_URL") ?? "";

  if (!assessment_id || !client_id || !assigned_to) {
    return new Response(
      JSON.stringify({ error: "assessment_id, client_id, and assigned_to are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: assessmentData, error: fetchError } = await supabaseClient
    .from("assessments")
    .select("id, name, created_by, assigned_to, client_id, target_completion_date")
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id)
    .single();

  if (fetchError || !assessmentData) {
    return new Response(
      JSON.stringify({ error: fetchError?.message || "Assessment not found" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error: updateError } = await supabaseClient
    .from("assessments")
    .update({ assigned_to, updated_at: new Date().toISOString() })
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (assignee?.email) {
    const updatedAssessment = { ...assessmentData, assigned_to };
    queueAssignedNotification(updatedAssessment, assignee, base_url)
      .catch(e => console.error("reassign notification error:", e));
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── notification ─────────────────────────────────────────────────────────────

async function queueAssignedNotification(assessment: any, assignee: any, baseUrl: string) {
  const assigneeName = `${assignee.first_name} ${assignee.last_name}`;

  const { data: rules } = await supabaseClient
    .from("notification_rules")
    .select("skip_conditions")
    .eq("module", "assessment")
    .eq("type", "assessment_assigned")
    .eq("is_active", true)
    .limit(1);

  if (rules && rules.length > 0) {
    const conditions: string[] = (rules[0].skip_conditions || []).map((c: string) => c.toLowerCase());

    if (conditions.includes("self_action") && assessment.created_by === assignee.id) {
      await supabaseClient.from("notification_logs").insert({
        module: "assessment",
        type: "assessment_assigned",
        recipient_id: assignee.id,
        recipient_email: assignee.email,
        subject: "",
        body: "",
        status: "skipped",
        metadata: { skipReason: "self_action" },
      });
      return;
    }

    if (conditions.includes("no_email") && !assignee.email?.trim()) {
      await supabaseClient.from("notification_logs").insert({
        module: "assessment",
        type: "assessment_assigned",
        recipient_id: assignee.id,
        recipient_email: "",
        subject: "",
        body: "",
        status: "skipped",
        metadata: { skipReason: "no_email" },
      });
      return;
    }

    if (conditions.includes("inactive_user")) {
      const { data: emp } = await supabaseClient
        .from("employees")
        .select("status")
        .eq("id", assignee.id)
        .maybeSingle();
      if (emp && !emp.status) {
        await supabaseClient.from("notification_logs").insert({
          module: "assessment",
          type: "assessment_assigned",
          recipient_id: assignee.id,
          recipient_email: assignee.email,
          subject: "",
          body: "",
          status: "skipped",
          metadata: { skipReason: "inactive_user" },
        });
        return;
      }
    }

    if (conditions.includes("already_notified")) {
      const { data: recent } = await supabaseClient
        .from("notification_logs")
        .select("created_at")
        .eq("module", "assessment")
        .eq("type", "assessment_assigned")
        .eq("recipient_id", assignee.id)
        .gte("created_at", new Date(Date.now() - 86400000).toISOString())
        .limit(1);
      if (recent && recent.length > 0) {
        await supabaseClient.from("notification_logs").insert({
          module: "assessment",
          type: "assessment_assigned",
          recipient_id: assignee.id,
          recipient_email: assignee.email,
          subject: "",
          body: "",
          status: "skipped",
          metadata: { skipReason: "already_notified" },
        });
        return;
      }
    }
  }

  const assignedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dueDate = assessment.target_completion_date
    ? new Date(assessment.target_completion_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not specified";
  const assessmentUrl = `${baseUrl}/assessments`;
  const subject = `New Assessment Assigned – [Assessment ID: ${assessment.id}]`;

  const { data: eq } = await supabaseClient
    .from("email_queue")
    .insert({
      module_name: "assessment",
      notification_type: "assessment_assigned",
      client_id: assessment.client_id,
      recipient_email: assignee.email,
      recipient_name: assigneeName,
      subject,
      body: "",
      params: {
        User_Name: assigneeName,
        Assessment_ID: assessment.id,
        Assessment_Title: assessment.name,
        Assigned_Date: assignedDate,
        Due_Date: dueDate,
        Assessment_URL: assessmentUrl,
        template_id: "frontend-assessment-assigned",
        module: "assessment",
        type: "assessment_assigned",
        priority: "medium",
      },
      priority: 0,
    })
    .select("id")
    .single();

  await supabaseClient.from("notification_logs").insert({
    module: "assessment",
    type: "assessment_assigned",
    recipient_id: assignee.id,
    recipient_email: assignee.email,
    subject,
    body: "",
    status: "pending",
    email_queue_id: eq?.id || null,
    metadata: {
      assessmentId: assessment.id,
      createdBy: assessment.created_by,
      assignedTo: assignee.id,
      actionBy: assessment.created_by,
    },
  });
}

