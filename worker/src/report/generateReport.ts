/**
 * Generate full monthly report PDF (no row cap). Runs in worker with higher memory.
 */
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  fetchVehiclesForReport,
  fetchVehicleChallansForReport,
  fetchEmployeesForReport,
  fetchEmployeeDocumentsForClient,
  fetchEmployeeDocumentTypes,
  fetchAssessmentsForReport,
  fetchIncidentsForReport,
  fetchGrievancesForReport,
} from "./fetchers.js";
import { MonthlyReportPDF } from "./pdf/MonthlyReportPDF.js";

const BUCKET_NAME = "monthly_export";

function getMonthRange(_year: number, _month: number) {
  return { start: "", end: "" };
}

export async function generateAndStoreReportForClient(
  supabase: SupabaseClient,
  clientId: string,
  year: number,
  month: number
): Promise<{ clientId: string; path: string }> {
  const startedAt = Date.now();
  const { start, end } = getMonthRange(year, month);

  console.log("[worker] report start", { clientId, year, month });

  const [vehicles, employees, documentTypes, challanData, assessments, incidents, grievances] =
    await Promise.all([
      fetchVehiclesForReport(supabase, clientId, start, end),
      fetchEmployeesForReport(supabase, clientId, start, end),
      fetchEmployeeDocumentTypes(supabase),
      fetchVehicleChallansForReport(supabase, clientId, start, end),
      fetchAssessmentsForReport(supabase, clientId, start, end),
      fetchIncidentsForReport(supabase, clientId, start, end),
      fetchGrievancesForReport(supabase, clientId, start, end),
    ]);

  const employeeDocuments = await fetchEmployeeDocumentsForClient(
    supabase,
    clientId,
    start,
    end,
    employees
  );

  const nVehicles = vehicles.length;
  const nEmployees = employees.length;
  const nAssessments = assessments.length;
  const nIncidents = incidents.length;
  const nGrievances = grievances.length;
  console.log("[worker] fetch counts", {
    clientId,
    vehicles: nVehicles,
    employees: nEmployees,
    employeeDocuments: employeeDocuments.length,
    assessments: nAssessments,
    incidents: nIncidents,
    grievances: nGrievances,
    challans: (challanData?.challans ?? []).length,
  });

  const report = {
    vehicles,
    vehiclesTotalCount: nVehicles,
    employees,
    employeesTotalCount: nEmployees,
    employeeDocuments,
    employeeDocumentsTotalCount: employeeDocuments.length,
    challans: challanData?.challans ?? [],
    challanTotal: challanData?.totalPendingAmount ?? 0,
    incidents,
    incidentsTotalCount: nIncidents,
    assessmentData: assessments,
    assessmentsTotalCount: nAssessments,
    grievancesSummary: grievances,
    grievancesTotalCount: nGrievances,
    documentTypes: documentTypes ?? [],
  };

  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const element = React.createElement(MonthlyReportPDF, {
    month: monthLabel,
    vehicles: report.vehicles,
    vehiclesTotalCount: report.vehiclesTotalCount,
    employees: report.employees,
    employeesTotalCount: report.employeesTotalCount,
    employeeDocuments: report.employeeDocuments,
    employeeDocumentsTotalCount: report.employeeDocumentsTotalCount,
    documentTypes: report.documentTypes,
    challans: report.challans,
    challanTotal: report.challanTotal,
    incidents: report.incidents,
    incidentsTotalCount: report.incidentsTotalCount,
    assessments: report.assessmentData,
    assessmentsTotalCount: report.assessmentsTotalCount,
    grievancesSummary: report.grievancesSummary,
    grievancesTotalCount: report.grievancesTotalCount,
  });

  const pdfBuffer = await renderToBuffer(element as React.ReactElement<any>);

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

  const durationMs = Date.now() - startedAt;
  console.log("[worker] report success", { clientId, path: filePath, durationMs });
  return { clientId, path: filePath };
}
