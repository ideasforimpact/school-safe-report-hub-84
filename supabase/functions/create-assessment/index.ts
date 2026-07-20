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

async function handle(body: any): Promise<Response> {
  const { client_id, name, description, template_id, assigned_to, target_completion_date, created_by, assignees } = body;

  const assigneeIds = normalizeAssigneeIds(assigned_to);

  if (!client_id || !name || !template_id || assigneeIds.length === 0 || !created_by) {
    return jsonError("Missing required fields", 400);
  }

  const { data: assessment, error: insertError } = await supabaseClient
    .from("assessments")
    .insert({
      name,
      description: description || null,
      template_id,
      // Kept populated for the common single-assignee case so legacy
      // reads that still filter on assessments.assigned_to keep working.
      assigned_to: assigneeIds.length === 1 ? assigneeIds[0] : null,
      target_completion_date: target_completion_date || null,
      status: "New",
      client_id,
      created_by,
    })
    .select()
    .single();

  if (insertError) {
    return jsonError(insertError.message);
  }

  const { error: assigneesError } = await supabaseClient
    .from("assessment_assignees")
    .insert(
      assigneeIds.map((employeeId) => ({
        assessment_id: assessment.id,
        employee_id: employeeId,
        client_id,
        assigned_by: created_by,
      }))
    );

  if (assigneesError) {
    return jsonError(assigneesError.message);
  }

  const assigneesToNotify = (assignees || []).filter(
    (assignee: any) => assigneeIds.includes(assignee?.id) && assignee.id !== created_by && assignee?.email
  );

  for (const assignee of assigneesToNotify) {
    queueAssessmentAssignedNotification(supabaseClient, assessment, assignee)
      .catch((e) => console.error("Failed to queue notification:", e));
  }

  return jsonOk({ assessment });
}
