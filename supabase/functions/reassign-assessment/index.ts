import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';
import {
  getAssessmentCorsHeaders,
  jsonError,
  jsonOk,
  normalizeAssigneeIds,
  queueAssessmentAssignedNotification,
} from '../_shared/assessmentAssignees.ts';

const corsHeaders = getAssessmentCorsHeaders();

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
        return jsonError("IP_NOT_WHITELISTED: Access denied. Your IP address is not whitelisted.", 403);
      }
    }
    return await handle(body);
  } catch (error) {
    console.error("Error processing request:", error);
    return jsonError((error as Error).message);
  }
});

// ─── handle ──────────────────────────────────────────────────────────────────

/**
 * Sets an assessment's assignee set to exactly `assigned_to`. Diffs the
 * desired set against the assessment's current active assessment_assignees
 * rows: newly-added employees get a row inserted (or reactivated, if they
 * had a soft-removed row from a previous unassignment) and are notified;
 * dropped employees are soft-removed (unassigned_at set) to preserve any
 * in-progress work, with untouched rows (still New, no answers) hard-deleted
 * to keep the table clean.
 */
async function handle(body: any): Promise<Response> {
  const { assessment_id, client_id, assigned_to, assignees } = body;

  const desiredIds = normalizeAssigneeIds(assigned_to);

  if (!assessment_id || !client_id || desiredIds.length === 0) {
    return jsonError("assessment_id, client_id, and assigned_to are required", 400);
  }

  const { data: assessmentData, error: fetchError } = await supabaseClient
    .from("assessments")
    .select("id, name, created_by, client_id, target_completion_date")
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id)
    .single();

  if (fetchError || !assessmentData) {
    return jsonError(fetchError?.message || "Assessment not found");
  }

  const { data: currentRows, error: currentError } = await supabaseClient
    .from("assessment_assignees")
    .select("employee_id")
    .eq("assessment_id", assessmentData.id)
    .is("unassigned_at", null);

  if (currentError) {
    return jsonError(currentError.message);
  }

  const currentIds: string[] = (currentRows || []).map((row: { employee_id: string }) => row.employee_id);
  const addedIds = desiredIds.filter((id) => !currentIds.includes(id));
  const removedIds = currentIds.filter((id) => !desiredIds.includes(id));

  if (addedIds.length > 0) {
    const { error: insertError } = await supabaseClient
      .from("assessment_assignees")
      .upsert(
        addedIds.map((employeeId) => ({
          assessment_id: assessmentData.id,
          employee_id: employeeId,
          client_id,
          assigned_by: assessmentData.created_by,
          unassigned_at: null,
        })),
        { onConflict: "assessment_id,employee_id" }
      );

    if (insertError) {
      return jsonError(insertError.message);
    }
  }

  if (removedIds.length > 0) {
    const { error: softRemoveError } = await supabaseClient
      .from("assessment_assignees")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("assessment_id", assessmentData.id)
      .in("employee_id", removedIds);

    if (softRemoveError) {
      return jsonError(softRemoveError.message);
    }

    await supabaseClient
      .from("assessment_assignees")
      .delete()
      .eq("assessment_id", assessmentData.id)
      .eq("status", "New")
      .eq("answers", "[]")
      .in("employee_id", removedIds);
  }

  // Kept populated for the common single-assignee case so legacy reads that
  // still filter on assessments.assigned_to keep working.
  const { error: updateError } = await supabaseClient
    .from("assessments")
    .update({
      assigned_to: desiredIds.length === 1 ? desiredIds[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id);

  if (updateError) {
    return jsonError(updateError.message);
  }

  const addedAssignees = (assignees || []).filter((a: any) => addedIds.includes(a?.id) && a?.email);
  for (const assignee of addedAssignees) {
    queueAssessmentAssignedNotification(supabaseClient, assessmentData, assignee)
      .catch((e) => console.error("reassign notification error:", e));
  }

  return jsonOk({ success: true });
}
