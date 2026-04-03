// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../_shared/env.ts";

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ProviderCount = { success: number; failed: number };
type DocAgg = {
  total_calls: number;
  success_count: number;
  failed_count: number;
  providerMap: Record<string, ProviderCount>;
};
type AuditEvent = {
  provider?: string;
  result?: string;
};

type VehicleAuditEvent = {
  provider?: string;
  result?: string;
  operation?: string;
};

function normalizeVehicleAuditLog(audit: unknown): VehicleAuditEvent[] {
  if (!audit) return [];
  if (!Array.isArray(audit)) return [];
  return audit.filter((item) => item && typeof item === "object") as VehicleAuditEvent[];
}

function normalizeDocTypeKey(name: string | null | undefined): string {
  const raw = (name || "unknown").toLowerCase().trim();
  if (raw === "aadhaar") return "aadhar_verification";
  if (raw === "aadhar") return "aadhar_verification";
  return `${raw.replace(/\s+/g, "_")}_verification`;
}

function addProviderCount(
  map: Record<string, ProviderCount>,
  provider: string,
  success: number,
  failed: number,
) {
  if (!provider) return;
  if (!map[provider]) map[provider] = { success: 0, failed: 0 };
  map[provider].success += success;
  map[provider].failed += failed;
}

function normalizeAuditEvents(audit: unknown): AuditEvent[] {
  if (!audit) return [];
  if (Array.isArray(audit)) {
    return audit.filter((item) => item && typeof item === "object") as AuditEvent[];
  }
  if (typeof audit === "object") {
    return Object.values(audit as Record<string, unknown>)
      .filter((item) => item && typeof item === "object") as AuditEvent[];
  }
  return [];
}

function providerListFromMap(providerMap: Record<string, ProviderCount>) {
  return Object.entries(providerMap).map(([providerName, counts]) => ({
    [providerName]: {
      success: counts.success,
      failed: counts.failed,
    },
  }));
}

/**
 * Aggregate vehicle_verification_api_calls for a client into rc_calls + challan_calls.
 * Provider split prefers audit_log events (operation: rc | challan); falls back to column + other_provider_*.
 */
function aggregateVehicleVerificationForClient(rows: Record<string, unknown>[]) {
  const rcMap: Record<string, ProviderCount> = {};
  const challanMap: Record<string, ProviderCount> = {};
  let rcAuditCount = 0;
  let challanAuditCount = 0;

  for (const row of rows || []) {
    const events = normalizeVehicleAuditLog(row.audit_log);
    for (const ev of events) {
      const op = String(ev.operation || "").toLowerCase();
      const provider = String(ev.provider || "").trim();
      const result = String(ev.result || "").toLowerCase();
      if (!provider) continue;
      const isSuccess = result === "success";
      const isFail = result === "failed" || result === "error";
      if (!isSuccess && !isFail) continue;

      if (op === "rc") {
        rcAuditCount++;
        addProviderCount(rcMap, provider, isSuccess ? 1 : 0, isFail ? 1 : 0);
      } else if (op === "challan") {
        challanAuditCount++;
        addProviderCount(challanMap, provider, isSuccess ? 1 : 0, isFail ? 1 : 0);
      }
    }
  }

  let rcSuccess = 0;
  let rcFailed = 0;
  let challanSuccess = 0;
  let challanFailed = 0;
  for (const row of rows || []) {
    rcSuccess += Number((row as any).rc_success || 0);
    rcFailed += Number((row as any).rc_failed || 0);
    challanSuccess += Number((row as any).challan_success || 0);
    challanFailed += Number((row as any).challan_failed || 0);
  }

  const rcTotal = rcSuccess + rcFailed;
  const challanTotal = challanSuccess + challanFailed;

  if (rcAuditCount === 0 && rcTotal > 0) {
    for (const row of rows || []) {
      const main = String((row as any).provider || "unknown");
      addProviderCount(rcMap, main, Number((row as any).rc_success || 0), Number((row as any).rc_failed || 0));
      const otherSuccessObj = (row as any).other_provider_success_call &&
          typeof (row as any).other_provider_success_call === "object"
        ? (row as any).other_provider_success_call
        : {};
      const otherFailedObj = (row as any).other_provider_failed_call &&
          typeof (row as any).other_provider_failed_call === "object"
        ? (row as any).other_provider_failed_call
        : {};
      const names = new Set<string>([
        ...Object.keys(otherSuccessObj || {}),
        ...Object.keys(otherFailedObj || {}),
      ]);
      for (const name of names) {
        const ps = Number((otherSuccessObj as any)?.[name]?.success || 0);
        const pf = Number((otherFailedObj as any)?.[name]?.failed || 0);
        addProviderCount(rcMap, name, ps, pf);
      }
    }
  }

  if (challanAuditCount === 0 && challanTotal > 0) {
    for (const row of rows || []) {
      const main = String((row as any).provider || "unknown");
      addProviderCount(
        challanMap,
        main,
        Number((row as any).challan_success || 0),
        Number((row as any).challan_failed || 0),
      );
      const otherSuccessObj = (row as any).other_provider_success_call &&
          typeof (row as any).other_provider_success_call === "object"
        ? (row as any).other_provider_success_call
        : {};
      const otherFailedObj = (row as any).other_provider_failed_call &&
          typeof (row as any).other_provider_failed_call === "object"
        ? (row as any).other_provider_failed_call
        : {};
      const names = new Set<string>([
        ...Object.keys(otherSuccessObj || {}),
        ...Object.keys(otherFailedObj || {}),
      ]);
      for (const name of names) {
        const ps = Number((otherSuccessObj as any)?.[name]?.success || 0);
        const pf = Number((otherFailedObj as any)?.[name]?.failed || 0);
        addProviderCount(challanMap, name, ps, pf);
      }
    }
  }

  return {
    rc_calls: {
      total_calls: rcTotal,
      success_count: rcSuccess,
      failed_count: rcFailed,
      provider: providerListFromMap(rcMap),
    },
    challan_calls: {
      total_calls: challanTotal,
      success_count: challanSuccess,
      failed_count: challanFailed,
      provider: providerListFromMap(challanMap),
    },
    vehicleSuccess: rcSuccess + challanSuccess,
    vehicleFailed: rcFailed + challanFailed,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json() : {};
    const action = body?.action ?? "get-client-api-calls";
    const clientId = body?.clientId;

    if (action !== "get-client-api-calls") {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: "clientId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: rows, error } = await supabase
      .from("employee_verification_api_calls")
      .select(
        "id, client_id, document_type, provider, success, failed, audit, other_provider_success_call, other_provider_failed_call",
      )
      .eq("client_id", clientId);

    if (error) throw error;

    const docTypeIds = [...new Set((rows || []).map((r: any) => r.document_type).filter(Boolean))];
    const docTypeMap = new Map<string, string>();
    if (docTypeIds.length > 0) {
      const { data: typeRows, error: typeError } = await supabase
        .from("employee_document_type")
        .select("id, name")
        .in("id", docTypeIds);
      if (typeError) throw typeError;
      (typeRows || []).forEach((t: any) => docTypeMap.set(t.id, t.name || "unknown"));
    }

    const aggregated: Record<string, DocAgg> = {};
    let overallSuccess = 0;
    let overallFailed = 0;

    for (const row of rows || []) {
      const docKey = normalizeDocTypeKey(docTypeMap.get(row.document_type));
      if (!aggregated[docKey]) {
        aggregated[docKey] = {
          total_calls: 0,
          success_count: 0,
          failed_count: 0,
          providerMap: {},
        };
      }

      const docAgg = aggregated[docKey];
      const rowSuccess = Number(row.success || 0);
      const rowFailed = Number(row.failed || 0);

      docAgg.success_count += rowSuccess;
      docAgg.failed_count += rowFailed;
      docAgg.total_calls += rowSuccess + rowFailed;

      overallSuccess += rowSuccess;
      overallFailed += rowFailed;

      const auditEvents = normalizeAuditEvents(row.audit);
      let usedAuditProviderBreakdown = false;

      if (auditEvents.length > 0) {
        usedAuditProviderBreakdown = true;
        for (const event of auditEvents) {
          const provider = String(event?.provider || "").trim();
          const result = String(event?.result || "").toLowerCase();
          if (!provider) continue;
          if (result === "success") {
            addProviderCount(docAgg.providerMap, provider, 1, 0);
          } else if (result === "failed" || result === "error") {
            addProviderCount(docAgg.providerMap, provider, 0, 1);
          }
        }
      }

      // Fallback for older rows where audit is absent/empty.
      if (!usedAuditProviderBreakdown) {
        addProviderCount(docAgg.providerMap, String(row.provider || "unknown"), rowSuccess, rowFailed);

        const otherSuccessObj = row.other_provider_success_call && typeof row.other_provider_success_call === "object"
          ? row.other_provider_success_call
          : {};
        const otherFailedObj = row.other_provider_failed_call && typeof row.other_provider_failed_call === "object"
          ? row.other_provider_failed_call
          : {};

        const providerNames = new Set<string>([
          ...Object.keys(otherSuccessObj || {}),
          ...Object.keys(otherFailedObj || {}),
        ]);

        for (const providerName of providerNames) {
          const providerSuccess = Number((otherSuccessObj as any)?.[providerName]?.success || 0);
          const providerFailed = Number((otherFailedObj as any)?.[providerName]?.failed || 0);
          addProviderCount(docAgg.providerMap, providerName, providerSuccess, providerFailed);
        }
      }
    }

    const groupedPayload: Record<string, unknown> = {};
    Object.entries(aggregated).forEach(([docType, value]) => {
      const providerList = Object.entries(value.providerMap).map(([providerName, counts]) => ({
        [providerName]: {
          success: counts.success,
          failed: counts.failed,
        },
      }));

      groupedPayload[docType] = {
        total_calls: value.total_calls,
        success_count: value.success_count,
        failed_count: value.failed_count,
        provider: providerList,
      };
    });

    const { data: vehicleRows, error: vehicleError } = await supabase
      .from("vehicle_verification_api_calls")
      .select(
        "id, client_id, vehicle_id, provider, rc_success, rc_failed, challan_success, challan_failed, audit_log, other_provider_success_call, other_provider_failed_call",
      )
      .eq("client_id", clientId);

    if (vehicleError) throw vehicleError;

    const vehicleAgg = aggregateVehicleVerificationForClient(vehicleRows || []);

    const vehiclePayload = {
      rc_calls: vehicleAgg.rc_calls,
      challan_calls: vehicleAgg.challan_calls,
    };

    const summaryTotalCalls =
      overallSuccess + overallFailed + vehicleAgg.vehicleSuccess + vehicleAgg.vehicleFailed;
    const summarySuccess = overallSuccess + vehicleAgg.vehicleSuccess;
    const summaryFailed = overallFailed + vehicleAgg.vehicleFailed;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          client_id: clientId,
          employee_verification_api_calls: [groupedPayload],
          vehicle_verification_api_calls: [vehiclePayload],
          summary: {
            total_calls: summaryTotalCalls,
            success_count: summarySuccess,
            failed_count: summaryFailed,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in client-api-calls:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

