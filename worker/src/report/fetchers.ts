/**
 * Fetchers for monthly report – no row cap (worker has higher memory).
 * Fetches ALL data per client for full compliance report.
 */
const WORKER_FETCH_LIMIT = 10000;

export async function fetchVehiclesForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, registration_number, verification_data, verification_status, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function fetchVehicleChallansForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("vehicle_challans")
    .select(
      `
      id, vehicle_id, latest_challan_data, created_at,
      vehicles!inner ( id, registration_number, internal_vehicle_name, client_id )
    `
    )
    .eq("vehicles.client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
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
          registration_number: row.vehicles?.registration_number,
          vehicle_name: row.vehicles?.internal_vehicle_name,
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

export async function fetchEmployeesForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_id, first_name, last_name, status, joining_date, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function fetchEmployeeDocumentsForClient(
  supabase: any,
  clientId: string,
  start: string,
  end: string,
  employees: any[]
) {
  const employeeIds = employees.map((e: any) => e.id);
  if (!employeeIds.length) return [];
  const { data: docs, error } = await supabase
    .from("employee_documents")
    .select(
      `
      id, employee_id, document_type_id, verification_status, created_at,
      employee_document_type:document_type_id ( id, name, description )
    `
    )
    .in("employee_id", employeeIds)
    .eq("is_delete", 0)
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  const employeeMap: Record<string, { name: string; employee_code: string; joining_date: any }> = {};
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

export async function fetchEmployeeDocumentTypes(supabase: any) {
  const { data, error } = await supabase
    .from("employee_document_type")
    .select("id, description, name")
    .order("name")
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAssessmentsForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("assessments")
    .select(
      `
      id, name, template_id, status, target_completion_date, created_at, assigned_to,
      employees!assessments_assigned_to_fkey ( id, first_name ),
      assessment_templates:template_id ( id, title )
    `
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function fetchIncidentsForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("incidents")
    .select(
      `
      id, description, category_id, status_id, date, type_id, created_at, priority_id, people_involved,
      incident_status:status_id ( id, name ),
      incident_categories:category_id ( id, name ),
      incident_priorities:priority_id ( id, name ),
      incident_report_types:type_id ( id, name )
    `
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function fetchGrievancesForReport(
  supabase: any,
  clientId: string,
  _start: string,
  _end: string
) {
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id, status, submitter_type, submitter_name, created_at, responses")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(WORKER_FETCH_LIMIT);
  if (error) throw error;
  return data ?? [];
}
