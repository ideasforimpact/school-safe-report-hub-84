/**
 * Shared helpers for the multi-assignee assessment edge functions
 * (create-assessment, reassign-assessment, list-assessments).
 *
 * One assessment can have multiple assignees, tracked in the
 * assessment_assignees table (one row per active assignee). The
 * assessments.assigned_to column is kept only as a legacy compatibility
 * value for the single-assignee case (populated when there's exactly one
 * assignee, null otherwise) — new code should not treat it as the source
 * of truth for "who is assigned."
 */

import { renderAssessmentTemplate } from "./assessmentNotificationTemplates.ts";
import { triggerImmediateEmailProcessing } from "./triggerEmailProcessing.ts";
import { getFrontendUrl } from "./env.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, path, id, client-id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/** Standard CORS headers shared by the assessment edge functions. */
export function getAssessmentCorsHeaders(): Record<string, string> {
  return CORS_HEADERS;
}

/** JSON success response with the shared CORS headers applied. */
export function jsonOk<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** JSON error response, shaped `{ error: message }`, matching this function family's existing contract. */
export function jsonError(message: string, status = 500): Response {
  return jsonOk({ error: message }, status);
}

/**
 * Normalizes an `assigned_to` request field into a plain array of employee
 * ids. Accepts an array (the current multi-assignee contract), a single id
 * string (older single-assignee callers), or a nullish value.
 */
export function normalizeAssigneeIds(assignedTo: unknown): string[] {
  if (Array.isArray(assignedTo)) return assignedTo.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (typeof assignedTo === "string" && assignedTo.length > 0) return [assignedTo];
  return [];
}

/**
 * Builds the `.or(...)` filter string PostgREST needs to scope a non-admin
 * employee's visible assessments to: assessments they created, are the
 * legacy single assigned_to for, or have an active assessment_assignees
 * row for.
 */
export function buildAssigneeVisibilityFilter(employeeId: string, assigneeAssessmentIds: string[]): string {
  const parts = [`created_by.eq.${employeeId}`, `assigned_to.eq.${employeeId}`];
  if (assigneeAssessmentIds.length > 0) {
    parts.push(`id.in.(${assigneeAssessmentIds.join(",")})`);
  }
  return parts.join(",");
}

/**
 * Fetches the ids of assessments the given employee is an active
 * (non-unassigned) assignee of, for use with buildAssigneeVisibilityFilter.
 */
export async function fetchAssigneeAssessmentIds(
  supabaseClient: { from: (table: string) => any },
  employeeId: string
): Promise<string[]> {
  const { data } = await supabaseClient
    .from("assessment_assignees")
    .select("assessment_id")
    .eq("employee_id", employeeId)
    .is("unassigned_at", null);

  return (data || []).map((row: { assessment_id: string }) => row.assessment_id);
}

/**
 * Recomputes the parent assessments.status from its assignees' individual
 * assessment_assignees.status values, per the owning template's
 * completion_mode:
 *   - 'all': every assignee must reach a given stage before the parent does
 *     (parent stays behind the slowest assignee — no single completion
 *     marks the whole assessment done for everyone else).
 *   - 'any' (default, matches historical single-assignee behavior): the
 *     parent advances as soon as one assignee does.
 * Call this after any assessment_assignees status change (submit, complete,
 * rework, or a new assignee added/removed) so assessments.status — read by
 * the dashboard counts and the creator's Complete/Rework gating — stays
 * consistent with reality instead of freezing at whatever one assignee did.
 */
export async function recomputeAssessmentAggregate(
  supabaseClient: { from: (table: string) => any },
  assessmentUuid: string
): Promise<void> {
  const { data: assessment } = await supabaseClient
    .from("assessments")
    .select("template_id")
    .eq("id", assessmentUuid)
    .maybeSingle();

  let completionMode = "any";
  if (assessment?.template_id) {
    const { data: template } = await supabaseClient
      .from("assessment_templates")
      .select("completion_mode")
      .eq("id", assessment.template_id)
      .maybeSingle();
    if (template?.completion_mode) completionMode = template.completion_mode;
  }

  const { data: rows } = await supabaseClient
    .from("assessment_assignees")
    .select("status")
    .eq("assessment_id", assessmentUuid)
    .is("unassigned_at", null);

  const statuses: string[] = (rows || []).map((row: { status: string }) => row.status);
  if (statuses.length === 0) return;

  let aggregate: string;
  if (completionMode === "all") {
    if (statuses.every((s) => s === "Completed")) aggregate = "Completed";
    else if (statuses.every((s) => s === "Completed" || s === "Submitted")) aggregate = "Submitted";
    else if (statuses.some((s) => s !== "New")) aggregate = "In Progress";
    else aggregate = "New";
  } else {
    if (statuses.some((s) => s === "Completed")) aggregate = "Completed";
    else if (statuses.some((s) => s === "Submitted")) aggregate = "Submitted";
    else if (statuses.some((s) => s !== "New")) aggregate = "In Progress";
    else aggregate = "New";
  }

  await supabaseClient
    .from("assessments")
    .update({ status: aggregate, updated_at: new Date().toISOString() })
    .eq("id", assessmentUuid);
}

interface NotifiableAssessment {
  id: string;
  name: string;
  created_by: string;
  client_id: string;
  target_completion_date: string | null;
}

interface NotifiableAssignee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Queues (and immediately triggers sending of) an "assessment assigned"
 * email + notification log entry for one assignee, honoring the
 * assessment_assigned notification_rules skip conditions (self_action,
 * no_email, inactive_user, already_notified). Shared by create-assessment
 * and reassign-assessment — both queue this same notification whenever an
 * employee is newly added as an assignee. Resolves the frontend URL itself
 * via getFrontendUrl() so callers don't each need their own (previously
 * inconsistent — some read a SITE_URL env var that was never actually set,
 * producing broken links like "http:///assessments") base-URL logic.
 */
export async function queueAssessmentAssignedNotification(
  supabaseClient: { from: (table: string) => any },
  assessment: NotifiableAssessment,
  assignee: NotifiableAssignee
): Promise<void> {
  const assigneeName = `${assignee.first_name} ${assignee.last_name}`;

  const logSkipped = (skipReason: string) =>
    supabaseClient.from("notification_logs").insert({
      module: "assessment",
      type: "assessment_assigned",
      recipient_id: assignee.id,
      recipient_email: assignee.email,
      subject: "",
      body: "",
      status: "skipped",
      metadata: { skipReason },
    });

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
      await logSkipped("self_action");
      return;
    }

    if (conditions.includes("no_email") && !assignee.email?.trim()) {
      await logSkipped("no_email");
      return;
    }

    if (conditions.includes("inactive_user")) {
      const { data: emp } = await supabaseClient
        .from("employees")
        .select("status")
        .eq("id", assignee.id)
        .maybeSingle();
      if (emp && !emp.status) {
        await logSkipped("inactive_user");
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
        await logSkipped("already_notified");
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
  const templateVariables = {
    User_Name: assigneeName,
    Assessment_ID: assessment.id,
    Assessment_Title: assessment.name,
    Assigned_Date: assignedDate,
    Due_Date: dueDate,
    Assessment_URL: `${getFrontendUrl()}/assessments`,
  };
  const { subject, body } = renderAssessmentTemplate("assessment_assigned", templateVariables);

  const { data: eq } = await supabaseClient
    .from("email_queue")
    .insert({
      module_name: "assessment",
      notification_type: "assessment_assigned",
      client_id: assessment.client_id,
      recipient_email: assignee.email,
      recipient_name: assigneeName,
      subject,
      body,
      params: {
        ...templateVariables,
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

  await triggerImmediateEmailProcessing(eq?.id);
}
