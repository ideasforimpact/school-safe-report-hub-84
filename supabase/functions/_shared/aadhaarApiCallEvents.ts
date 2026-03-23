// @ts-nocheck
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { recordEmployeeVerificationApiCall } from "./employeeVerificationApiCalls.ts";

type AadhaarOperation = "generate_otp" | "verify_otp";
type AadhaarProvider = "quickekyc" | "surepass";

type RecordAadhaarApiCallEventInput = {
  supabase: SupabaseClient;
  clientId?: string | null;
  employeeId: string;
  documentId: string;
  documentTypeId: string | null;
  provider: AadhaarProvider;
  primaryProvider: AadhaarProvider;
  operation: AadhaarOperation;
  isSuccess: boolean;
  requestGroupId?: string;
  apiResponse?: any;
};

function toAuditArray(audit: unknown): any[] {
  if (Array.isArray(audit)) return audit;
  if (audit && typeof audit === "object") {
    // Legacy format (timestamp keyed object) -> convert best-effort
    return Object.entries(audit as Record<string, any>).map(([ts, e]) => ({
      ts,
      provider: e?.provider ?? "unknown",
      role: "primary",
      result: Number(e?.success ?? 0) > 0 ? "success" : "failed",
    }));
  }
  return [];
}

function providerCountsFromAudit(auditEvents: any[], provider: string) {
  let success = 0;
  let failed = 0;
  for (const event of auditEvents) {
    if (event?.provider !== provider) continue;
    if (event?.result === "success") success += 1;
    else if (event?.result === "failed") failed += 1;
  }
  return { success, failed };
}

export async function recordAadhaarApiCallEvent(input: RecordAadhaarApiCallEventInput) {
  const {
    supabase,
    employeeId,
    documentId,
    documentTypeId,
    provider,
    primaryProvider,
    operation,
    isSuccess,
    requestGroupId,
    apiResponse,
  } = input;

  // 1) Update summary counters/audit
  await recordEmployeeVerificationApiCall({
    supabase,
    clientId: input.clientId ?? null,
    employeeId,
    documentId,
    documentTypeId,
    provider,
    primaryProvider,
    isMultiple: false,
    isSuccess,
  });

  // 2) Read updated summary row for totals + audit-derived provider counts
  const { data: summary, error: summaryError } = await supabase
    .from("employee_verification_api_calls")
    .select("id, client_id, success, failed, audit")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (summaryError) throw summaryError;

  const auditEvents = toAuditArray(summary?.audit);
  const providerCounts = providerCountsFromAudit(auditEvents, provider);

  // 3) Derive provider+operation counts from event table history
  const { data: existingOperationEvents, error: existingOpError } = await supabase
    .from("employee_verification_api_call_events")
    .select("result")
    .eq("document_id", documentId)
    .eq("provider", provider)
    .eq("operation", operation);

  if (existingOpError) throw existingOpError;

  let operationSuccess = 0;
  let operationFailed = 0;
  for (const e of existingOperationEvents ?? []) {
    if (e?.result === "success") operationSuccess += 1;
    else if (e?.result === "failed") operationFailed += 1;
  }
  if (isSuccess) operationSuccess += 1;
  else operationFailed += 1;

  // 4) Insert event row (one row per API attempt)
  await supabase.from("employee_verification_api_call_events").insert({
    summary_id: summary?.id ?? null,
    client_id: summary?.client_id ?? input.clientId ?? null,
    employee_id: employeeId,
    document_id: documentId,
    document_type: documentTypeId,
    provider,
    provider_role: provider === primaryProvider ? "primary" : "fallback",
    operation,
    result: isSuccess ? "success" : "failed",
    request_group_id: requestGroupId ?? null,
    total_counts_after: {
      success: Number(summary?.success ?? 0),
      failed: Number(summary?.failed ?? 0),
    },
    provider_counts_after: providerCounts,
    provider_operation_counts_after: {
      success: operationSuccess,
      failed: operationFailed,
    },
    api_response: apiResponse ?? null,
    created_at: new Date().toISOString(),
  });
}

