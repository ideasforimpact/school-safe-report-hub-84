import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';
import {
  buildAssigneeVisibilityFilter,
  fetchAssigneeAssessmentIds,
  getAssessmentCorsHeaders,
  jsonError,
  jsonOk,
} from '../_shared/assessmentAssignees.ts';

const corsHeaders = getAssessmentCorsHeaders();

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface RequestBody {
  client_id?: string;
  page?: number;
  search?: string;
  status?: string;
  created_by?: string;
  assigned_to?: string;
  target_date_from?: string | null;
  target_date_to?: string | null;
  assessment_id_url?: string | null;
  is_admin?: boolean;
  employee_id?: string | null;
  include_meta?: boolean;
  assessment_id?: string;
  client_type_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  try {
    const path = req.headers.get("path") || "list";
    let body: RequestBody = {};
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
    switch (path) {
      case "get":          return await handleGet(body);
      case "employees":    return await handleEmployees(body);
      case "names":        return await handleNames(body);
      case "audit-logs":   return await handleAuditLogs(body);
      case "templates":    return await handleTemplates(body);
      case "categories":   return await handleCategories();
      case "category":     return await handleCategoryById(body);
      case "create-form":  return await handleCreateForm(body);
      default:             return await handleList(body);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return jsonError((error as Error).message);
  }
});

// ─── list ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

interface PersonName {
  first_name: string;
  last_name: string;
}

interface AssessmentRow {
  id: string;
  assessment_id: string;
  name: string;
  status: string;
  target_completion_date: string | null;
  created_by: string;
  assigned_to: string;
  template_id: string;
  created_at: string;
  score: number | null;
  answers: unknown;
  client_id: string;
  is_reworked?: boolean;
  creator: PersonName | null;
  assignee: PersonName | null;
  assessment_assignees: {
    employee_id: string;
    unassigned_at: string | null;
    status: string;
    answers: unknown;
    score: number | null;
    employee: PersonName | null;
  }[] | null;
  template: { questions: unknown } | null;
}

/**
 * Resolves an assessment row's active assignees from assessment_assignees,
 * falling back to the legacy single assigned_to/assignee columns for rows
 * written before that table existed (or by a code path that regressed to
 * single-assignee writes) so they never show as unassigned.
 */
function resolveActiveAssignees(row: Pick<AssessmentRow, 'assessment_assignees' | 'assigned_to' | 'assignee'>) {
  const activeAssignees = (row.assessment_assignees || [])
    .filter((a) => !a.unassigned_at)
    .map((a) => ({
      id: a.employee_id,
      name: a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : 'Unknown',
    }));

  if (activeAssignees.length > 0) return activeAssignees;

  if (row.assigned_to && row.assignee) {
    return [{ id: row.assigned_to, name: `${row.assignee.first_name} ${row.assignee.last_name}` }];
  }

  return activeAssignees;
}

interface ListResponse {
  assessments: unknown[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts?: {
    total: number;
    new: number;
    draft: number;
    submitted: number;
    completed: number;
  };
  creators?: { id: string; name: string }[];
  assignees?: { id: string; name: string }[];
}

async function handleList(body: RequestBody): Promise<Response> {
  const {
    client_id,
    page = 1,
    search = "",
    status = "all",
    created_by = "all",
    assigned_to = "all",
    target_date_from = null,
    target_date_to = null,
    assessment_id_url = null,
    is_admin = false,
    employee_id = null,
    include_meta = false,
  } = body;

  if (!client_id) {
    return jsonError("client_id is required", 400);
  }

  // One assessment can now have multiple assignees (assessment_assignees), so
  // role-based visibility must also include assessments where this employee
  // is an assignee but not the legacy single assessments.assigned_to.
  const assigneeAssessmentIds = !is_admin && employee_id
    ? await fetchAssigneeAssessmentIds(supabaseClient, employee_id)
    : [];

  const buildBaseQuery = () =>
    supabaseClient
      .from("assessments")
      .select(
        `id,assessment_id,name,status,target_completion_date,created_by,assigned_to,` +
        `template_id,created_at,score,answers,client_id,is_reworked,` +
        `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
        `assignee:employees!assessments_assigned_to_fkey(first_name,last_name),` +
        `assessment_assignees(employee_id,unassigned_at,status,answers,score,employee:employees!assessment_assignees_employee_id_fkey(first_name,last_name)),` +
        `template:assessment_templates(questions)`,
        { count: 'exact' }
      )
      .eq("client_id", client_id);

  const applyFilters = (q: ReturnType<typeof buildBaseQuery>) => {
    if (!is_admin && employee_id) {
      q = q.or(buildAssigneeVisibilityFilter(employee_id, assigneeAssessmentIds));
    }
    if (assessment_id_url) {
      q = q.eq("id", assessment_id_url);
    } else if (search) {
      q = q.ilike("name", `%${search}%`);
    }
    if (status !== "all")     q = q.ilike("status", status);
    if (created_by !== "all") q = q.eq("created_by", created_by);
    if (assigned_to !== "all") q = q.eq("assigned_to", assigned_to);
    if (target_date_from)     q = q.gte("target_completion_date", target_date_from);
    if (target_date_to)       q = q.lte("target_completion_date", target_date_to);
    return q;
  };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let pageQuery = buildBaseQuery();

  pageQuery = applyFilters(pageQuery);
  pageQuery = pageQuery.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await pageQuery;

  if (error) {
    return jsonError(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const assessments = (data || []).map((a: AssessmentRow) => {
    const activeAssignees = resolveActiveAssignees(a);
    const activeRows = (a.assessment_assignees || []).filter((row) => !row.unassigned_at);
    const totalQuestions = Array.isArray(a.template?.questions) ? (a.template!.questions as unknown[]).length : 0;

    // Each assignee's status/progress is independent — if the viewer is
    // themself an assignee, show THEIR OWN row here, not the shared
    // parent's aggregate. Falls back to the parent (e.g. for an admin
    // viewing an assessment they're not personally assigned to).
    const myRow = employee_id ? activeRows.find((row) => row.employee_id === employee_id) : null;

    // assessments.answers is no longer written once there's a real
    // assessment_assignees row (answers live per-assignee now), so
    // completion % must come from there too, not the now-stale parent
    // column — otherwise it freezes at 0% forever once someone submits.
    const answeredCount = (answers: unknown) =>
      Array.isArray(answers)
        ? answers.filter((x) => x && typeof x === "object" && (x as { answer?: unknown }).answer !== undefined).length
        : 0;
    const percentageFor = (answers: unknown) =>
      totalQuestions === 0 ? 0 : Math.round((answeredCount(answers) / totalQuestions) * 100);

    const completionPercentage = myRow
      ? percentageFor(myRow.answers)
      : activeRows.length > 0
        ? Math.round(activeRows.reduce((sum, row) => sum + percentageFor(row.answers), 0) / activeRows.length)
        : percentageFor(a.answers);

    return {
      ...a,
      status: myRow ? myRow.status : a.status,
      answers: Array.isArray(myRow ? myRow.answers : a.answers) ? (myRow ? myRow.answers : a.answers) : [],
      score: myRow ? myRow.score : a.score,
      completion_percentage: completionPercentage,
      creator_name: a.creator ? `${a.creator.first_name} ${a.creator.last_name}` : 'Unknown',
      assignees: activeAssignees,
      assignee_name: activeAssignees.length > 0
        ? activeAssignees.map((x) => x.name).join(', ')
        : 'Unassigned',
      template: a.template
        ? { questions: Array.isArray(a.template.questions) ? a.template.questions : [] }
        : undefined,
    };
  });

  const response: ListResponse = { assessments, totalCount, page, pageSize: PAGE_SIZE, totalPages };

  if (include_meta) {
    let statusQuery = supabaseClient
      .from("assessments")
      .select("status")
      .eq("client_id", client_id);
    if (!is_admin && employee_id) {
      statusQuery = statusQuery.or(buildAssigneeVisibilityFilter(employee_id, assigneeAssessmentIds));
    }
    const { data: allStatuses } = await statusQuery;
    const statuses: { status: string }[] = allStatuses || [];
    response.statusCounts = {
      total: statuses.length,
      new: statuses.filter((a) => a.status === 'New').length,
      draft: statuses.filter((a) => a.status === 'Draft').length,
      submitted: statuses.filter((a) => a.status === 'Submitted').length,
      completed: statuses.filter((a) => a.status === 'Completed').length,
    };

    let metaQuery = supabaseClient
      .from("assessments")
      .select(
        `created_by,assigned_to,` +
        `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
        `assignee:employees!assessments_assigned_to_fkey(first_name,last_name),` +
        `assessment_assignees(employee_id,unassigned_at,employee:employees!assessment_assignees_employee_id_fkey(first_name,last_name))`
      )
      .eq("client_id", client_id);
    if (!is_admin && employee_id) {
      metaQuery = metaQuery.or(buildAssigneeVisibilityFilter(employee_id, assigneeAssessmentIds));
    }
    const { data: metaData } = await metaQuery;

    const creatorsMap = new Map<string, string>();
    const assigneesMap = new Map<string, string>();
    (metaData || []).forEach((a: {
      created_by: string; assigned_to: string; creator: PersonName | null; assignee: PersonName | null;
      assessment_assignees: { employee_id: string; unassigned_at: string | null; employee: PersonName | null }[] | null;
    }) => {
      if (a.created_by && a.creator) {
        creatorsMap.set(a.created_by, `${a.creator.first_name} ${a.creator.last_name}`);
      }
      if (a.assigned_to && a.assignee) {
        assigneesMap.set(a.assigned_to, `${a.assignee.first_name} ${a.assignee.last_name}`);
      }
      (a.assessment_assignees || []).forEach((row) => {
        if (!row.unassigned_at && row.employee_id && row.employee) {
          assigneesMap.set(row.employee_id, `${row.employee.first_name} ${row.employee.last_name}`);
        }
      });
    });
    response.creators  = Array.from(creatorsMap.entries()).map(([id, name]) => ({ id, name }));
    response.assignees = Array.from(assigneesMap.entries()).map(([id, name]) => ({ id, name }));
  }

  return jsonOk(response);
}

// ─── get ─────────────────────────────────────────────────────────────────────

async function handleGet(body: RequestBody & { employee_id?: string }): Promise<Response> {
  const { assessment_id, client_id, employee_id } = body;

  if (!client_id || !assessment_id) {
    return jsonError("client_id and assessment_id are required", 400);
  }

  const { data, error } = await supabaseClient
    .from("assessments")
    .select(
      `id,assessment_id,name,status,target_completion_date,created_at,score,answers,` +
      `completed_on,closure_comments,closure_attachment,is_reworked,rework_comments,rework_attachments,` +
      `submit_comment,submit_attachment,created_by,assigned_to,template_id,` +
      `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
      `assignee:employees!assessments_assigned_to_fkey(first_name,last_name),` +
      `completed_by_employee:employees!assessments_completed_by_fkey(first_name,last_name),` +
      `assessment_assignees(id,employee_id,unassigned_at,status,answers,score,submit_comment,submit_attachment,` +
        `closure_comments,closure_attachment,rework_comments,rework_attachments,is_reworked,completed_by,completed_on,` +
        `employee:employees!assessment_assignees_employee_id_fkey(first_name,last_name)),` +
      `template:assessment_templates(id,title,description,questions,client_id,completion_mode)`
    )
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id)
    .single();

  if (error) {
    return jsonError(error.message);
  }

  const activeAssignees = (data.assessment_assignees || []).filter((a: any) => !a.unassigned_at);
  const myAssignee = employee_id ? activeAssignees.find((a: any) => a.employee_id === employee_id) : null;

  return jsonOk({
    assessment: {
      ...data,
      // Every assignee's own independent progress, for the creator/reviewer view.
      assignees: activeAssignees.map((a: any) => ({
        id: a.id,
        employee_id: a.employee_id,
        name: a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : "Unknown",
        status: a.status,
        answers: a.answers,
        score: a.score,
        completed_by: a.completed_by,
        completed_on: a.completed_on,
        closure_comments: a.closure_comments,
        rework_comments: a.rework_comments,
      })),
      // The viewing employee's own copy, when they are themselves an
      // assignee — the answer screen reads/writes THIS, never the shared
      // parent fields, so one assignee's progress can never appear as
      // another assignee's status.
      my_status: myAssignee?.status ?? null,
      my_answers: myAssignee?.answers ?? null,
      my_score: myAssignee?.score ?? null,
      my_submit_comment: myAssignee?.submit_comment ?? null,
      my_submit_attachment: myAssignee?.submit_attachment ?? null,
    },
  });
}

// ─── employees ───────────────────────────────────────────────────────────────

async function handleEmployees(body: any): Promise<Response> {
  const { client_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("employees")
    .select(`id,first_name,last_name,email,aadhar_verified_name,department,employee_departments:department(id,department_name)`)
    .eq("client_id", client_id)
    .eq("status", true)
    .eq("is_secondary_super_admin", false)
    .not("email", "is", null)
    .order("first_name");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ employees: data || [] }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── names ───────────────────────────────────────────────────────────────────

async function handleNames(body: any): Promise<Response> {
  const { client_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("assessments")
    .select("name")
    .eq("client_id", client_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ names: (data || []).map((a: any) => a.name.toLowerCase()) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── create-form (employees + names in one call) ─────────────────────────────

async function handleCreateForm(body: any): Promise<Response> {
  const { client_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const [employeesResult, namesResult] = await Promise.all([
    supabaseClient
      .from("employees")
      .select(`id,first_name,last_name,email,aadhar_verified_name,department,employee_departments:department(id,department_name)`)
      .eq("client_id", client_id)
      .eq("status", true)
      .eq("is_secondary_super_admin", false)
      .not("email", "is", null)
      .order("first_name"),
    supabaseClient
      .from("assessments")
      .select("name")
      .eq("client_id", client_id),
  ]);

  if (employeesResult.error) {
    return new Response(
      JSON.stringify({ error: employeesResult.error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (namesResult.error) {
    return new Response(
      JSON.stringify({ error: namesResult.error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      employees: employeesResult.data || [],
      names: (namesResult.data || []).map((a: any) => a.name.toLowerCase()),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── templates ───────────────────────────────────────────────────────────────

async function handleTemplates(body: RequestBody): Promise<Response> {
  const { client_id, client_type_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let query = supabaseClient
    .from("assessment_templates")
    .select(`id,title,description,category_id,is_active,questions,created_at,created_by,template_categories(id,name,description)`)
    .eq("client_id", client_id);

  if (client_type_id) {
    query = query.eq("client_type_id", client_type_id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ templates: data || [] }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── categories ──────────────────────────────────────────────────────────────

async function handleCategories(): Promise<Response> {
  const { data, error } = await supabaseClient
    .from("template_categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ categories: (data || []).map((c: any) => c.name) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── category (single, by id) ────────────────────────────────────────────────

async function handleCategoryById(body: any): Promise<Response> {
  const { id } = body;

  if (!id) {
    return new Response(
      JSON.stringify({ error: "id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("template_categories")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ name: data?.name ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── audit-logs ──────────────────────────────────────────────────────────────

async function handleAuditLogs(body: any): Promise<Response> {
  const { assessment_id } = body;

  if (!assessment_id) {
    return new Response(
      JSON.stringify({ error: "assessment_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: auditData, error: auditError } = await supabaseClient
    .from("assessment_audit_log")
    .select("*")
    .eq("assessment_id", assessment_id)
    .order("changed_at", { ascending: false });

  if (auditError) {
    return new Response(
      JSON.stringify({ error: auditError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!auditData || auditData.length === 0) {
    return new Response(
      JSON.stringify({ logs: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userIds = [...new Set(auditData.map((log: any) => log.changed_by).filter(Boolean))];
  const { data: userData } = await supabaseClient
    .from("employees")
    .select("user_id, first_name, last_name, email")
    .in("user_id", userIds);

  const userMap = new Map<string, any>();
  (userData || []).forEach((user: any) => {
    userMap.set(user.user_id, {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
  });

  const logs = auditData.map((log: any) => ({
    ...log,
    changed_by_user: log.changed_by ? userMap.get(log.changed_by) : undefined,
  }));

  return new Response(
    JSON.stringify({ logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
