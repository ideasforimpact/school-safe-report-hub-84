import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";
import { validateIPWhitelist } from "../_shared/safe-school/ipValidator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CpdDomainRow = {
  id: string;
  name: string;
  threshold: number | null;
  active: boolean;
};

type CpdEntryRow = {
  id: string;
  employee_id: string | null;
  client_id: string;
  title: string;
  hour: number | null;
  cpd_domain: {
    id: string;
    name: string;
    threshold: number | null;
  } | null;
};

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  department: {
    id: string;
    department_name: string;
  } | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const clientId: string | null = body.client_id ?? body.clientId ?? null;
    const employeeId: string | null = body.employee_id ?? body.employeeId ?? null;
    const isSuperAdmin: boolean = !!(body.is_super_admin ?? body.isSuperAdmin);

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "client_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      clientId,
      url.pathname,
    );
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({
          error: "IP_NOT_WHITELISTED",
          message: "Access denied. Your IP address is not whitelisted for this client.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch CPD domains (used for thresholds and domain grouping)
    const { data: domainRows, error: domainError } = await supabase
      .from("cpd_domain")
      .select("id, name, threshold, active")
      .eq("active", true);

    if (domainError) {
      console.error("Error fetching CPD domains:", domainError);
      return new Response(
        JSON.stringify({ error: domainError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const domains = (domainRows ?? []) as CpdDomainRow[];

    // Map domain names to keys for breakdown (Core Values, Knowledge, Growth)
    const normalizeDomain = (name: string): "core_values" | "knowledge" | "growth" | "other" => {
      const lower = name.toLowerCase();
      if (lower.includes("core") || lower.includes("ethic")) return "core_values";
      if (lower.includes("knowledge") || lower.includes("practice")) return "knowledge";
      if (lower.includes("growth") || lower.includes("development")) return "growth";
      return "other";
    };

    // Precompute thresholds
    let coreValuesThreshold = 0;
    let knowledgeThreshold = 0;
    let growthThreshold = 0;
    let totalCpdThreshold = 0;

    for (const d of domains) {
      const h = d.threshold ?? 0;
      const key = normalizeDomain(d.name);
      if (key === "core_values") coreValuesThreshold += h;
      else if (key === "knowledge") knowledgeThreshold += h;
      else if (key === "growth") growthThreshold += h;
      totalCpdThreshold += h;
    }

    // Determine which employees to fetch
    let employeeFilterIds: string[] | null = null;

    if (isSuperAdmin) {
      // Super admin: only employees with is_cpd_involved = true for this client
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("client_id", clientId)
        .eq("status", true)
        .eq("is_cpd_involved", true);

      if (empError) {
        console.error("Error fetching employees:", empError);
        return new Response(
          JSON.stringify({ error: empError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      employeeFilterIds = (employees ?? []).map((e: any) => e.id);
    } else if (employeeId) {
      // Non-super admin: only include this employee if they have is_cpd_involved = true
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("id", employeeId)
        .eq("client_id", clientId)
        .eq("status", true)
        .eq("is_cpd_involved", true)
        .maybeSingle();

      if (empError || !emp) {
        employeeFilterIds = [];
      } else {
        employeeFilterIds = [emp.id];
      }
    } else {
      employeeFilterIds = [];
    }

    if (!employeeFilterIds || employeeFilterIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          total_staff: 0,
          compliant_count: 0,
          at_risk_count: 0,
          total_cpd: totalCpdThreshold,
          employees: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch employees with basic info
    const { data: employeeRows, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department:department (id, department_name)")
      .in("id", employeeFilterIds);

    if (employeeError) {
      console.error("Error fetching employee rows:", employeeError);
      return new Response(
        JSON.stringify({ error: employeeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const employeesById: Record<string, EmployeeRow> = {};
    for (const e of employeeRows ?? []) {
      employeesById[e.id] = e as unknown as EmployeeRow;
    }

    // Fetch CPD entries for these employees
    const { data: cpdEntriesRows, error: cpdError } = await supabase
      .from("cpd_entries")
      .select(`
        id,
        employee_id,
        client_id,
        title,
        category,
        cpd_learning,
        document_urls,
        captured_date,
        hour,
        cpd_domain:domain_id(id, name, threshold)
      `)
      .eq("client_id", clientId)
      .in("employee_id", employeeFilterIds)
      .eq("active", true);

    if (cpdError) {
      console.error("Error fetching CPD entries:", cpdError);
      return new Response(
        JSON.stringify({ error: cpdError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const entries = (cpdEntriesRows ?? []) as any as (CpdEntryRow & {
      captured_date?: string | null;
    })[];

    // Group entries by employee
    const entriesByEmployee: Record<string, CpdEntryRow[]> = {};
    for (const id of employeeFilterIds) {
      entriesByEmployee[id] = [];
    }
    for (const entry of entries) {
      if (!entry.employee_id) continue;
      if (!entriesByEmployee[entry.employee_id]) {
        entriesByEmployee[entry.employee_id] = [];
      }
      entriesByEmployee[entry.employee_id].push(entry);
    }

    // Build response rows
    const employeesResult: any[] = [];
    let compliantCount = 0;
    let atRiskCount = 0;

    for (const empId of employeeFilterIds) {
      const info = employeesById[empId];
      if (!info) continue;

      const empEntries = (entriesByEmployee[empId] ?? []) as (CpdEntryRow & {
        captured_date?: string | null;
      })[];

      let obtainedCpd = 0;
      let coreValuesHours = 0;
      let knowledgeHours = 0;
      let growthHours = 0;

      // per-domain usage map for this employee
      const domainHours: Record<
        string,
        { domain_id: string; domain_name: string; used_hours: number }
      > = {};

      const transformedEntries = empEntries.map((e) => {
        const hours = e.hour ?? 0;
        obtainedCpd += hours;

        const domainId = e.cpd_domain?.id ?? "";
        const domainName = e.cpd_domain?.name ?? "";

        if (domainId) {
          if (!domainHours[domainId]) {
            domainHours[domainId] = {
              domain_id: domainId,
              domain_name: domainName,
              used_hours: 0,
            };
          }
          domainHours[domainId].used_hours += hours;
        }

        const key = normalizeDomain(domainName);
        if (key === "core_values") coreValuesHours += hours;
        else if (key === "knowledge") knowledgeHours += hours;
        else if (key === "growth") growthHours += hours;

        return {
          id: e.id,
          title: e.title,
          domain_name: domainName,
          hours,
          captured_date: (e as any).captured_date ?? null,
          category: (e as any).category ?? null,
          cpd_learning: (e as any).cpd_learning ?? null,
          document_urls: (e as any).document_urls ?? [],
        };
      });

      // Determine status
      let status: "In Progress" | "At Risk" | "Compliant" = "At Risk";
      if (obtainedCpd >= totalCpdThreshold && totalCpdThreshold > 0) {
        status = "Compliant";
        compliantCount += 1;
      } else if (obtainedCpd > 30) {
        status = "In Progress";
      } else {
        atRiskCount += 1;
      }

      const fullName = [info.first_name, info.last_name].filter(Boolean).join(" ") || "—";
      const rawDeptName = info.department?.department_name ?? null;
      const departmentName =
        rawDeptName && rawDeptName.length > 0
          ? rawDeptName.charAt(0).toUpperCase() + rawDeptName.slice(1)
          : null;

      // compact domain usage info for client-side remaining-hours logic
      const domainHoursMap: Record<string, number> = {};
      for (const [domId, value] of Object.entries(domainHours)) {
        domainHoursMap[domId] = value.used_hours;
      }

      employeesResult.push({
        employee_id: empId,
        employee_name: fullName,
        department_name: departmentName,
        cpd_entries: transformedEntries,
        obtained_cpd: obtainedCpd,
        total_cpd: totalCpdThreshold,
        status,
        core_values_hours: coreValuesHours,
        knowledge_hours: knowledgeHours,
        growth_hours: growthHours,
        core_values_threshold: coreValuesThreshold,
        knowledge_threshold: knowledgeThreshold,
        growth_threshold: growthThreshold,
        domain_hours: domainHoursMap,
      });
    }

    const totalStaff = employeesResult.length;

    return new Response(
      JSON.stringify({
        success: true,
        total_staff: totalStaff,
        compliant_count: compliantCount,
        at_risk_count: atRiskCount,
        total_cpd: totalCpdThreshold,
        employees: employeesResult,
        domains: domains.map((d) => ({
          id: d.id,
          name: d.name,
          threshold: d.threshold ?? 0,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("cpd_overview_list error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

