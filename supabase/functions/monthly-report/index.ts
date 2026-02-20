import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

import React from "npm:react@18.2.0";
import { renderToBuffer } from "npm:@react-pdf/renderer@3.4.4";

import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";
import { MonthlyReportPDF } from "./MonthlyReportPDF.tsx";

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();
const BUCKET_NAME = "monthly_export";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getMonthRange(year: number, month: number) {
  const start = '';
  const end = '';
  return { start, end };
}

// --- server-side versions of src/services/monthly-export/monthlyReport.ts ---

async function fetchVehiclesForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      registration_number,
      verification_data,
      verification_status,
      created_at
    `)
    .eq("client_id", clientId);
  if (error) throw error;
  return data ?? [];
}

async function fetchVehicleChallansForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("vehicle_challans")
    .select(`
      id,
      vehicle_id,
      latest_challan_data,
      created_at,
      vehicles!inner (
        id,
        registration_number,
        internal_vehicle_name,
        client_id
      )
    `)
    .eq("vehicles.client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  let totalPendingAmount = 0;
  const pendingChallans: any[] = [];

  rows.forEach((row: any) => {
    const challanList =
      row.latest_challan_data?.data?.challan_details?.challans ?? [];

    challanList.forEach((c: any) => {
      const status = (c.challan_status || "").toLowerCase();
      if (status === "pending") {
        const amount = Number(c.amount || 0);
        totalPendingAmount += amount;
        pendingChallans.push({
          vehicle_id: row.vehicle_id,
          registration_number: row.vehicles.registration_number,
          vehicle_name: row.vehicles.internal_vehicle_name,
          challan_number: c.number || c.challan_number || "-",
          date: c.challan_date || "-",
          amount,
          status,
          name: c.accused_name || "-",
          created_at: row.created_at,
        });
      }
    });
  });

  pendingChallans.sort((a, b) => {
    const d1 = new Date(a.date || a.created_at).getTime();
    const d2 = new Date(b.date || b.created_at).getTime();
    return d2 - d1;
  });

  return { challans: pendingChallans, totalPendingAmount };
}

async function fetchEmployeesForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("employees")
    .select(`
      id,
      employee_id,
      first_name,
      last_name,
      status,
      joining_date,
      created_at
    `)
    .eq("client_id", clientId);
  if (error) throw error;
  return data ?? [];
}

async function fetchEmployeeDocumentsForClient(supabase: any, clientId: string, start: string, end: string) {
  const employees = await fetchEmployeesForReport(supabase, clientId, start, end);
  const employeeIds = employees.map((e: any) => e.id);
  if (!employeeIds.length) return [];

  const { data: docs, error } = await supabase
    .from("employee_documents")
    .select(`
      id,
      employee_id,
      document_type_id,
      verification_status,
      created_at,
      employee_document_type:document_type_id (
        id,
        name,
        description
      )
    `)
    .in("employee_id", employeeIds)
    .eq("is_delete", 0);
  if (error) throw error;

  const employeeMap: any = {};
  employees.forEach((emp: any) => {
    employeeMap[emp.id] = {
      name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
      employee_code: emp.employee_id,
      joining_date: emp.joining_date,
    };
  });

  return (docs ?? []).map((doc: any) => ({
    employee_id: doc.employee_id,
    employee_name: employeeMap[doc.employee_id]?.name || "Employee",
    employee_code: employeeMap[doc.employee_id]?.employee_code || "-",
    document_type_id: doc.employee_document_type?.id,
    document_type: doc.employee_document_type?.description,
    joining_date: employeeMap[doc.employee_id]?.joining_date || "-",
    verification_status: doc.verification_status,
  }));
}

async function fetchEmployeeDocumentTypes(supabase: any) {
  const { data, error } = await supabase
    .from("employee_document_type")
    .select("id, description, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchAssessmentsForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("assessments")
    .select(`
      id,
      name,
      template_id,
      status,
      target_completion_date,
      created_at,
      assigned_to,
      employees!assessments_assigned_to_fkey (
        id,
        first_name
      ),
      assessment_templates:template_id(
        id,
        title
      )
    `)
    .eq("client_id", clientId);
  if (error) throw error;
  return data ?? [];
}

async function fetchIncidentsForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      id,
      description,
      category_id,
      status_id,
      date,
      type_id,
      created_at,
      priority_id,
      people_involved,
      incident_status:status_id ( id, name ),
      incident_categories:category_id( id, name ),
      incident_priorities:priority_id( id, name ),
      incident_report_types:type_id( id, name )
    `)
    .eq("client_id", clientId);
  if (error) throw error;
  return data ?? [];
}

async function fetchGrievancesForReport(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("form_submissions")
    .select(`
      id,
      status,
      submitter_type,
      submitter_name,
      created_at,
      responses
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function generateAndStoreReportForClient(
  supabase: any,
  clientId: string,
  year: number,
  month: number,
) {
  const { start, end } = getMonthRange(year, month);

  const [
    vehicles,
    employees,
    employeeDocuments,
    assessments,
    documentTypes,
    challanData,
    incidents,
    grievances,
  ] = await Promise.all([
    fetchVehiclesForReport(supabase, clientId, start, end),
    fetchEmployeesForReport(supabase, clientId, start, end),
    fetchEmployeeDocumentsForClient(supabase, clientId, start, end),
    fetchAssessmentsForReport(supabase, clientId, start, end),
    fetchEmployeeDocumentTypes(supabase),
    fetchVehicleChallansForReport(supabase, clientId, start, end),
    fetchIncidentsForReport(supabase, clientId, start, end),
    fetchGrievancesForReport(supabase, clientId, start, end),
  ]);

  const report = {
    vehicles: vehicles ?? [],
    employees: employees ?? [],
    employeeDocuments: employeeDocuments ?? [],
    challans: challanData?.challans ?? [],
    challanTotal: challanData?.totalPendingAmount ?? 0,
    incidents: incidents ?? [],
    assessmentData: assessments ?? [],
    grievancesSummary: grievances ?? [],
    documentTypes,
  };

  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const element = React.createElement(MonthlyReportPDF, {
    month: monthLabel,
    vehicles: report.vehicles,
    employees: report.employees,
    employeeDocuments: report.employeeDocuments,
    documentTypes: report.documentTypes,
    challans: report.challans,
    challanTotal: report.challanTotal,
    incidents: report.incidents,
    assessments: report.assessmentData,
    grievancesSummary: report.grievancesSummary,
  });

  const pdfBuffer = await renderToBuffer(element);

  // Folder uses target month's last day (DD-MM-YYYY)
  const lastDay = new Date(year, month, 0).getDate();
  const day = String(lastDay).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yyyy = String(year);

  const folderName = `${day}-${mm}-${yyyy}`;
  const folder = `${clientId}/${folderName}`;
  const fileName = `Monthly_Report_${clientId}_${yyyy}_${mm}.pdf`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  return { clientId, path: filePath };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const clientId = body.clientId as string | undefined;
    const inputYear = body.year as number | undefined;
    const inputMonth = body.month as number | undefined;

    // Single-job mode: consumer calls with one client + target month (returns path for queue complete)
    if (clientId && inputYear != null && inputMonth != null) {
      const result = await generateAndStoreReportForClient(supabase, clientId, inputYear, inputMonth);
      return new Response(
        JSON.stringify({ success: true, path: result.path }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cron mode: enqueue one row per active client (super admin as target_employee), then invoke consumer
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, active")
      .eq("active", true);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch clients" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientIds = (clients ?? []).map((c: any) => c.id);
    if (!clientIds.length) {
      return new Response(
        JSON.stringify({ success: false, error: "No active clients found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    const reportYear = now.getFullYear();
    const reportMonth = now.getMonth() + 1; // 1-based
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    const prepareDate = now.getDate();
    const prepareMonth = now.getMonth() + 1;
    const prepareYear = now.getFullYear();

    for (const cid of clientIds) {
      const { data: superAdmin } = await supabase
        .from("employees")
        .select("id")
        .eq("client_id", cid)
        .eq("is_super_admin", true)
        .limit(1)
        .single();

      if (!superAdmin?.id) continue; // skip client with no super admin

      const { data: existing } = await supabase
        .from("monthly_export_queue")
        .select("id")
        .eq("client_id", cid)
        .eq("target_employee_id", superAdmin.id)
        .eq("target_month", reportMonth)
        .eq("target_date", lastDay)
        .eq("target_year", reportYear)
        .limit(1)
        .maybeSingle();

      if (existing) continue; // already queued for this client/employee/target/prepare combo, skip

      await supabase.from("monthly_export_queue").insert({
        client_id: cid,
        target_employee_id: superAdmin.id,
        target_month: reportMonth,
        target_date: lastDay,
        target_year: reportYear,
        prepare_month: prepareMonth,
        prepare_date: prepareDate,
        prepare_year: prepareYear,
        is_queued: true,
        error_queue_msg: null,
        retry_count: 0,
        max_retries: 2,
        active: true,
        status: null,
      });
    }

    try {
      await (supabase as any).functions.invoke("monthly-report-consumer", { body: {} });
    } catch (invokeErr) {
      console.error("Failed to trigger monthly-report-consumer:", invokeErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Enqueued and consumer invoked", year: reportYear, month: reportMonth }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("monthly-report error", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

