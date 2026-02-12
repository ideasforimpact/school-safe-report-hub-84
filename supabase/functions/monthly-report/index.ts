import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

import React from "npm:react@18.2.0";
import { renderToBuffer } from "npm:@react-pdf/renderer@3.4.4";

import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";
import { MonthlyReportPDF } from "./MonthlyReportPDF.tsx";

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();
const BUCKET_NAME = "montly_export";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString();
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
    .eq("client_id", clientId)
    .gte("created_at", start)
    .lte("created_at", end);
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
    .gte("created_at", start)
    .lte("created_at", end)
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
    .eq("client_id", clientId)
    .gte("created_at", start)
    .lte("created_at", end);
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
        name
      )
    `)
    .in("employee_id", employeeIds)
    .eq("is_delete", 0)
    .gte("created_at", start)
    .lte("created_at", end);
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
    document_type: doc.employee_document_type?.name,
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
    .eq("client_id", clientId)
    .gte("created_at", start)
    .lte("created_at", end);
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
    .eq("client_id", clientId)
    .gte("created_at", start)
    .lte("created_at", end);
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
    .gte("created_at", start)
    .lte("created_at", end)
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

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
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
    const inputYear = body.year as number | undefined;
    const inputMonth = body.month as number | undefined;

    // Always derive clientIds from active clients in DB
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
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = inputYear ?? prev.getFullYear();
    const month = inputMonth ?? prev.getMonth() + 1;

    const reports: any[] = [];
    for (const cid of clientIds) {
      reports.push(await generateAndStoreReportForClient(supabase, cid, year, month));
    }

    console.log("MONTHLY EXOPRT DONE SUCCESSFULLY")
    return new Response(
      JSON.stringify({ success: true, year, month, reports }),
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

