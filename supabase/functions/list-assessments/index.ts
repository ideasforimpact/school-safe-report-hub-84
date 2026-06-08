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
    const path = req.headers.get("path") || "list";
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
      case "get":          return await handleGet(body);
      case "employees":    return await handleEmployees(body);
      case "names":        return await handleNames(body);
      case "audit-logs":   return await handleAuditLogs(body);
      case "templates":    return await handleTemplates(body);
      case "create-form":  return await handleCreateForm(body);
      default:             return await handleList(body);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── list ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

async function handleList(body: any): Promise<Response> {
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
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const applyFilters = (q: any) => {
    if (!is_admin && employee_id) {
      q = q.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`);
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

  let pageQuery = supabaseClient
    .from("assessments")
    .select(
      `id,assessment_id,name,status,target_completion_date,created_by,assigned_to,` +
      `template_id,created_at,score,answers,client_id,` +
      `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
      `assignee:employees!assessments_assigned_to_fkey(first_name,last_name),` +
      `template:assessment_templates(questions)`,
      { count: 'exact' }
    )
    .eq("client_id", client_id);

  pageQuery = applyFilters(pageQuery);
  pageQuery = pageQuery.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await pageQuery;

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const assessments = (data || []).map((a: any) => ({
    ...a,
    answers: Array.isArray(a.answers) ? a.answers : [],
    creator_name: a.creator ? `${a.creator.first_name} ${a.creator.last_name}` : 'Unknown',
    assignee_name: a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : 'Unassigned',
    template: a.template
      ? { questions: Array.isArray(a.template.questions) ? a.template.questions : [] }
      : undefined,
  }));

  const response: any = { assessments, totalCount, page, pageSize: PAGE_SIZE, totalPages };

  if (include_meta) {
    let statusQuery = supabaseClient
      .from("assessments")
      .select("status")
      .eq("client_id", client_id);
    if (!is_admin && employee_id) {
      statusQuery = statusQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`);
    }
    const { data: allStatuses } = await statusQuery;
    const statuses = allStatuses || [];
    response.statusCounts = {
      total: statuses.length,
      new: statuses.filter((a: any) => a.status === 'New').length,
      draft: statuses.filter((a: any) => a.status === 'Draft').length,
      submitted: statuses.filter((a: any) => a.status === 'Submitted').length,
      completed: statuses.filter((a: any) => a.status === 'Completed').length,
    };

    let metaQuery = supabaseClient
      .from("assessments")
      .select(
        `created_by,assigned_to,` +
        `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
        `assignee:employees!assessments_assigned_to_fkey(first_name,last_name)`
      )
      .eq("client_id", client_id);
    if (!is_admin && employee_id) {
      metaQuery = metaQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`);
    }
    const { data: metaData } = await metaQuery;

    const creatorsMap = new Map<string, string>();
    const assigneesMap = new Map<string, string>();
    (metaData || []).forEach((a: any) => {
      if (a.created_by && a.creator) {
        creatorsMap.set(a.created_by, `${a.creator.first_name} ${a.creator.last_name}`);
      }
      if (a.assigned_to && a.assignee) {
        assigneesMap.set(a.assigned_to, `${a.assignee.first_name} ${a.assignee.last_name}`);
      }
    });
    response.creators  = Array.from(creatorsMap.entries()).map(([id, name]) => ({ id, name }));
    response.assignees = Array.from(assigneesMap.entries()).map(([id, name]) => ({ id, name }));
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── get ─────────────────────────────────────────────────────────────────────

async function handleGet(body: any): Promise<Response> {
  const { assessment_id, client_id } = body;

  if (!client_id || !assessment_id) {
    return new Response(
      JSON.stringify({ error: "client_id and assessment_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("assessments")
    .select(
      `id,assessment_id,name,status,target_completion_date,created_at,score,answers,` +
      `completed_on,closure_comments,rework_comments,created_by,assigned_to,template_id,` +
      `creator:employees!assessments_created_by_fkey(first_name,last_name),` +
      `assignee:employees!assessments_assigned_to_fkey(first_name,last_name),` +
      `completed_by_employee:employees!assessments_completed_by_fkey(first_name,last_name),` +
      `template:assessment_templates(id,title,description,questions,client_id)`
    )
    .eq("assessment_id", assessment_id)
    .eq("client_id", client_id)
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
    .select(`id,first_name,last_name,email,department,employee_departments:department(id,department_name)`)
    .eq("client_id", client_id)
    .eq("status", true)
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
      .select(`id,first_name,last_name,email,department,employee_departments:department(id,department_name)`)
      .eq("client_id", client_id)
      .eq("status", true)
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

async function handleTemplates(body: any): Promise<Response> {
  const { client_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ error: "client_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("assessment_templates")
    .select(`id,title,description,category_id,is_active,questions,created_at,created_by,template_categories(id,name,description)`)
    .eq("client_id", client_id)
    .order("created_at", { ascending: false });

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
