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
    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(s => s.length > 0);
    const lastSegment = segments[segments.length - 1];
    const knownActions = ['submit-assessment', 'complete-assessment', 'rework-assessment', 'save-draft'];
    const path = knownActions.includes(lastSegment) ? lastSegment : 'save-draft';
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
    switch (path) {
      case "submit-assessment":   return await handleSubmit(body);
      case "complete-assessment": return await handleComplete(body);
      case "rework-assessment":   return await handleRework(body);
      default:                    return await handleDraft(body);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── draft ───────────────────────────────────────────────────────────────────

async function handleDraft(body: any): Promise<Response> {
  const { assessment_id, client_id, status, answers } = body;

  if (!assessment_id || !client_id) {
    return new Response(
      JSON.stringify({ error: "assessment_id and client_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("assessments")
    .update({ status, answers, updated_at: new Date().toISOString() })
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ assessment: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── submit ──────────────────────────────────────────────────────────────────

async function handleSubmit(body: any): Promise<Response> {
  const { assessment_id, client_id, score, answers, performed_by, assessment_info } = body;
  const base_url = Deno.env.get("SITE_URL") ?? "";

  if (!assessment_id || !client_id) {
    return new Response(
      JSON.stringify({ error: "assessment_id and client_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabaseClient
    .from("assessments")
    .update({ status: "Submitted", score, answers, updated_at: new Date().toISOString() })
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (assessment_info?.created_by && performed_by) {
    queueSubmittedNotification(assessment_info, performed_by, client_id, base_url)
      .catch(e => console.error("submit notification error:", e));
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── complete ────────────────────────────────────────────────────────────────

async function handleComplete(body: any): Promise<Response> {
  const { id, client_id, closure_comments, completed_by, completed_on, performed_by, assessment_info } = body;
  const base_url = Deno.env.get("SITE_URL") ?? "";

  if (!id || !client_id) {
    return new Response(
      JSON.stringify({ error: "id and client_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabaseClient
    .from("assessments")
    .update({
      status: "Completed",
      completed_by: completed_by || null,
      completed_on: completed_on || new Date().toISOString(),
      closure_comments: closure_comments || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("client_id", client_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (assessment_info?.assigned_to && performed_by) {
    queueCompletedNotification(id, assessment_info, performed_by, client_id, base_url)
      .catch(e => console.error("complete notification error:", e));
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── rework ──────────────────────────────────────────────────────────────────

async function handleRework(body: any): Promise<Response> {
  const { id, client_id, rework_comments, performed_by, assessment_info } = body;
  const base_url = Deno.env.get("SITE_URL") ?? "";

  if (!id || !client_id) {
    return new Response(
      JSON.stringify({ error: "id and client_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabaseClient
    .from("assessments")
    .update({
      status: "Draft",
      rework_comments: rework_comments || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("client_id", client_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (assessment_info?.assigned_to && performed_by) {
    queueReworkNotification(id, assessment_info, rework_comments, performed_by, client_id, base_url)
      .catch(e => console.error("rework notification error:", e));
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── notification helpers ─────────────────────────────────────────────────────

async function getSkipConditions(type: string): Promise<string[]> {
  const { data: rules } = await supabaseClient
    .from("notification_rules")
    .select("skip_conditions")
    .eq("module", "assessment")
    .eq("type", type)
    .eq("is_active", true)
    .limit(1);
  return rules && rules.length > 0
    ? (rules[0].skip_conditions || []).map((c: string) => c.toLowerCase())
    : [];
}

async function queueSubmittedNotification(
  assessmentInfo: any,
  performed_by: any,
  client_id: string,
  baseUrl: string
) {
  const { data: creator } = await supabaseClient
    .from("employees")
    .select("id, first_name, last_name, email, status")
    .eq("user_id", assessmentInfo.created_by)
    .maybeSingle();

  if (!creator || !creator.email) return;

  const conditions = await getSkipConditions("assessment_submitted");

  if (conditions.includes("self_action") && performed_by.id === assessmentInfo.created_by) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_submitted",
      recipient_id: creator.id,
      recipient_email: creator.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "self_action" },
    });
    return;
  }

  if (conditions.length === 0 && performed_by.id === assessmentInfo.created_by) return;

  if (conditions.includes("no_email") && !creator.email.trim()) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_submitted",
      recipient_id: creator.id,
      recipient_email: "",
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "no_email" },
    });
    return;
  }

  if (conditions.includes("inactive_user") && !creator.status) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_submitted",
      recipient_id: creator.id,
      recipient_email: creator.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "inactive_user" },
    });
    return;
  }

  if (conditions.includes("already_notified")) {
    const { data: recent } = await supabaseClient
      .from("notification_logs")
      .select("created_at")
      .eq("module", "assessment")
      .eq("type", "assessment_submitted")
      .eq("recipient_id", creator.id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) {
      await supabaseClient.from("notification_logs").insert({
        module: "assessment",
        type: "assessment_submitted",
        recipient_id: creator.id,
        recipient_email: creator.email,
        subject: "",
        body: "",
        status: "skipped",
        metadata: { skipReason: "already_notified" },
      });
      return;
    }
  }

  const submittedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const submitterName = `${performed_by.first_name} ${performed_by.last_name}`;
  const creatorName = `${creator.first_name} ${creator.last_name}`;
  const assessmentUrl = `${baseUrl}/assessments`;
  const subject = `Assessment Submitted – [Assessment ID: ${assessmentInfo.id}]`;

  const { data: eq } = await supabaseClient
    .from("email_queue")
    .insert({
      module_name: "assessment",
      notification_type: "assessment_submitted",
      client_id,
      recipient_email: creator.email,
      recipient_name: creatorName,
      subject,
      body: "",
      params: {
        User_Name: creatorName,
        Assessment_ID: assessmentInfo.id,
        Assessment_Title: assessmentInfo.name,
        Submitted_By: submitterName,
        Submitted_Date: submittedDate,
        Assessment_URL: assessmentUrl,
        template_id: "frontend-assessment-submitted",
        module: "assessment",
        type: "assessment_submitted",
        priority: "medium",
      },
      priority: 0,
    })
    .select("id")
    .single();

  await supabaseClient.from("notification_logs").insert({
    module: "assessment",
    type: "assessment_submitted",
    recipient_id: creator.id,
    recipient_email: creator.email,
    subject,
    body: "",
    status: "pending",
    email_queue_id: eq?.id || null,
    metadata: {
      assessmentId: assessmentInfo.id,
      createdBy: assessmentInfo.created_by,
      assignedTo: assessmentInfo.assigned_to,
      actionBy: performed_by.id,
    },
  });
}

async function queueCompletedNotification(
  assessmentUuid: string,
  assessmentInfo: any,
  performed_by: any,
  client_id: string,
  baseUrl: string
) {
  const { data: assignee } = await supabaseClient
    .from("employees")
    .select("id, first_name, last_name, email, status")
    .eq("id", assessmentInfo.assigned_to)
    .maybeSingle();

  if (!assignee || !assignee.email) return;

  const conditions = await getSkipConditions("assessment_completed");

  if (conditions.includes("self_action") && performed_by.id === assignee.id) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_completed",
      recipient_id: assignee.id,
      recipient_email: assignee.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "self_action" },
    });
    return;
  }

  if (conditions.length === 0 && performed_by.id === assignee.id) return;

  if (conditions.includes("no_email") && !assignee.email.trim()) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_completed",
      recipient_id: assignee.id,
      recipient_email: "",
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "no_email" },
    });
    return;
  }

  if (conditions.includes("inactive_user") && !assignee.status) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_completed",
      recipient_id: assignee.id,
      recipient_email: assignee.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "inactive_user" },
    });
    return;
  }

  if (conditions.includes("already_notified")) {
    const { data: recent } = await supabaseClient
      .from("notification_logs")
      .select("created_at")
      .eq("module", "assessment")
      .eq("type", "assessment_completed")
      .eq("recipient_id", assignee.id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) {
      await supabaseClient.from("notification_logs").insert({
        module: "assessment",
        type: "assessment_completed",
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

  const completedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const completedByName = `${performed_by.first_name} ${performed_by.last_name}`;
  const assigneeName = `${assignee.first_name} ${assignee.last_name}`;
  const assessmentUrl = `${baseUrl}/assessments`;
  const subject = `Assessment Completed – [Assessment ID: ${assessmentUuid}]`;

  const { data: eq } = await supabaseClient
    .from("email_queue")
    .insert({
      module_name: "assessment",
      notification_type: "assessment_completed",
      client_id,
      recipient_email: assignee.email,
      recipient_name: assigneeName,
      subject,
      body: "",
      params: {
        User_Name: assigneeName,
        Assessment_ID: assessmentUuid,
        Assessment_Title: assessmentInfo.name,
        Completed_By: completedByName,
        Completed_Date: completedDate,
        Assessment_URL: assessmentUrl,
        template_id: "frontend-assessment-completed",
        module: "assessment",
        type: "assessment_completed",
        priority: "medium",
      },
      priority: 0,
    })
    .select("id")
    .single();

  await supabaseClient.from("notification_logs").insert({
    module: "assessment",
    type: "assessment_completed",
    recipient_id: assignee.id,
    recipient_email: assignee.email,
    subject,
    body: "",
    status: "pending",
    email_queue_id: eq?.id || null,
    metadata: {
      assessmentId: assessmentUuid,
      assignedTo: assessmentInfo.assigned_to,
      actionBy: performed_by.id,
    },
  });
}

async function queueReworkNotification(
  assessmentUuid: string,
  assessmentInfo: any,
  reworkComments: string | null,
  performed_by: any,
  client_id: string,
  baseUrl: string
) {
  const { data: assignee } = await supabaseClient
    .from("employees")
    .select("id, first_name, last_name, email, status")
    .eq("id", assessmentInfo.assigned_to)
    .maybeSingle();

  if (!assignee || !assignee.email) return;

  const conditions = await getSkipConditions("assessment_rework_required");

  if (conditions.includes("self_action") && performed_by.id === assignee.id) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_rework_required",
      recipient_id: assignee.id,
      recipient_email: assignee.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "self_action" },
    });
    return;
  }

  if (conditions.length === 0 && performed_by.id === assignee.id) return;

  if (conditions.includes("no_email") && !assignee.email.trim()) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_rework_required",
      recipient_id: assignee.id,
      recipient_email: "",
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "no_email" },
    });
    return;
  }

  if (conditions.includes("inactive_user") && !assignee.status) {
    await supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_rework_required",
      recipient_id: assignee.id,
      recipient_email: assignee.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason: "inactive_user" },
    });
    return;
  }

  if (conditions.includes("already_notified")) {
    const { data: recent } = await supabaseClient
      .from("notification_logs")
      .select("created_at")
      .eq("module", "assessment")
      .eq("type", "assessment_rework_required")
      .eq("recipient_id", assignee.id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) {
      await supabaseClient.from("notification_logs").insert({
        module: "assessment",
        type: "assessment_rework_required",
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

  const requestedByName = `${performed_by.first_name} ${performed_by.last_name}`;
  const assigneeName = `${assignee.first_name} ${assignee.last_name}`;
  const reworkReason = reworkComments || "Please rework this assessment";
  const assessmentUrl = `${baseUrl}/assessments`;
  const subject = `Rework Required – [Assessment ID: ${assessmentUuid}]`;
  const { data: eq } = await supabaseClient
    .from("email_queue")
    .insert({
      module_name: "assessment",
      notification_type: "assessment_rework_required",
      client_id,
      recipient_email: assignee.email,
      recipient_name: assigneeName,
      subject,
      body: "",
      params: {
        User_Name: assigneeName,
        Assessment_ID: assessmentUuid,
        Assessment_Title: assessmentInfo.name,
        Requested_By: requestedByName,
        Rework_Reason: reworkReason,
        Assessment_URL: assessmentUrl,
        template_id: "frontend-assessment-rework-required",
        module: "assessment",
        type: "assessment_rework_required",
        priority: "high",
      },
      priority: 1,
    })
    .select("id")
    .single();

  await supabaseClient.from("notification_logs").insert({
    module: "assessment",
    type: "assessment_rework_required",
    recipient_id: assignee.id,
    recipient_email: assignee.email,
    subject,
    body: "",
    status: "pending",
    email_queue_id: eq?.id || null,
    metadata: {
      assessmentId: assessmentUuid,
      assignedTo: assessmentInfo.assigned_to,
      actionBy: performed_by.id,
      reworkReason,
    },
  });
}
