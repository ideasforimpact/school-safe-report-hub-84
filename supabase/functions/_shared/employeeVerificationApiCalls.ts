// @ts-nocheck
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

export type ApiProvider = string;

type RecordEmployeeVerificationApiCallInput = {
  supabase: SupabaseClient;
  clientId?: string | null;
  employeeId: string;
  documentId: string;
  documentTypeId: string | null;

  /**
   * Provider actually called this attempt (primary or fallback).
   * Example: driving-license primary='quickekyc', fallback='surepass'
   */
  provider: ApiProvider;

  /**
   * Which provider should update the main `success`/`failed` columns.
   * Any other provider updates `other_provider_*` columns.
   */
  primaryProvider: ApiProvider;

  isMultiple: boolean;

  /**
   * True when the provider call was successful (based ONLY on API response).
   * False when provider call failed (based ONLY on API response).
   */
  isSuccess: boolean;
};

function toObjectOrEmpty(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v !== "object") return {};
  if (Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function getNestedNumber(v: unknown, nestedKey: string): number {
  if (!v || typeof v !== "object" || Array.isArray(v)) return 0;
  const obj = v as Record<string, unknown>;
  return typeof obj[nestedKey] === "number" ? (obj[nestedKey] as number) : 0;
}

type AuditEvent = {
  ts: string;
  provider: string;
  role: "primary" | "fallback";
  result: "success" | "failed";
  total_counts_after: { success: number; failed: number };
  provider_counts_after: { success: number; failed: number };
};

function countProviderFromAudit(events: AuditEvent[], provider: string): { success: number; failed: number } {
  let success = 0;
  let failed = 0;
  for (const e of events) {
    if (e.provider !== provider) continue;
    if (e.result === "success") success += 1;
    else failed += 1;
  }
  return { success, failed };
}

function normalizeAuditEvents(existingAudit: unknown): AuditEvent[] {
  if (!existingAudit) return [];

  // New format: array of event objects
  if (Array.isArray(existingAudit)) {
    return existingAudit
      .filter((x) => x && typeof x === "object")
      .map((x: any) => ({
        ts: String(x.ts ?? x.date_time ?? new Date().toISOString()),
        provider: String(x.provider ?? "unknown"),
        role: x.role === "fallback" ? "fallback" : "primary",
        result: x.result === "success" ? "success" : "failed",
        total_counts_after: {
          success: Number(x?.total_counts_after?.success ?? 0),
          failed: Number(x?.total_counts_after?.failed ?? 0),
        },
        provider_counts_after: {
          success: Number(x?.provider_counts_after?.success ?? 0),
          failed: Number(x?.provider_counts_after?.failed ?? 0),
        },
      }));
  }

  // Backward compatibility: old object keyed by timestamp
  if (typeof existingAudit === "object") {
    const obj = existingAudit as Record<string, any>;
    return Object.entries(obj).map(([ts, entry]) => ({
      ts,
      provider: String(entry?.provider ?? "unknown"),
      role: "primary",
      result: Number(entry?.success ?? 0) > 0 ? "success" : "failed",
      total_counts_after: {
        success: Number(entry?.success ?? 0),
        failed: Number(entry?.error ?? 0),
      },
      provider_counts_after: {
        success: Number(entry?.success ?? 0),
        failed: Number(entry?.error ?? 0),
      },
    }));
  }

  return [];
}

export async function recordEmployeeVerificationApiCall(
  input: RecordEmployeeVerificationApiCallInput,
) {
  const {
    supabase,
    employeeId,
    documentId,
    documentTypeId,
    provider,
    primaryProvider,
    isMultiple,
    isSuccess,
  } = input;

  if (!documentTypeId) {
    console.warn("recordEmployeeVerificationApiCall: documentTypeId missing, skipping", { documentId });
    return;
  }

  const nowIso = new Date().toISOString();

  let clientId = input.clientId ?? null;
  if (!clientId) {
    const { data: employeeRow, error: employeeError } = await supabase
      .from("employees")
      .select("client_id")
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) throw employeeError;
    clientId = employeeRow?.client_id ?? null;
  }

  if (!clientId) {
    console.warn("recordEmployeeVerificationApiCall: clientId missing, skipping", { employeeId });
    return;
  }

  const isPrimaryAttempt = provider === primaryProvider;
  const successInc = isSuccess ? 1 : 0;
  const failedInc = isSuccess ? 0 : 1;

  const { data: existing, error: findError } = await supabase
    .from("employee_verification_api_calls")
    .select(
      "id, success, failed, audit, other_provider_success_call, other_provider_failed_call",
    )
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  const nextAuditBase = normalizeAuditEvents(existing?.audit);
  const nextOtherSuccess = toObjectOrEmpty(existing?.other_provider_success_call);
  const nextOtherFailed = toObjectOrEmpty(existing?.other_provider_failed_call);

  let nextMainSuccess = (existing?.success ?? 0) as number;
  let nextMainFailed = (existing?.failed ?? 0) as number;

  // Main counters represent TOTAL API attempts across ALL providers.
  if (existing) {
    nextMainSuccess += successInc;
    nextMainFailed += failedInc;
  }

  if (existing && !isPrimaryAttempt) {
    const curSuccessObj = nextOtherSuccess[String(provider)] ?? {};
    const curFailedObj = nextOtherFailed[String(provider)] ?? {};

    const curProviderSuccess = getNestedNumber(curSuccessObj, "success");
    const curProviderFailed = getNestedNumber(curFailedObj, "failed");

    (nextOtherSuccess as any)[String(provider)] = { success: curProviderSuccess + successInc };
    (nextOtherFailed as any)[String(provider)] = { failed: curProviderFailed + failedInc };
  }

  if (!existing) {
    // First attempt: create row and initialize counters.
    const auditEvent: AuditEvent = {
      ts: nowIso,
      provider,
      role: isPrimaryAttempt ? "primary" : "fallback",
      result: isSuccess ? "success" : "failed",
      total_counts_after: {
        success: successInc,
        failed: failedInc,
      },
      provider_counts_after: {
        success: successInc,
        failed: failedInc,
      },
    };

    await supabase.from("employee_verification_api_calls").insert({
      client_id: clientId,
      employee_id: employeeId,
      document_id: documentId,
      document_type: documentTypeId,
      provider: primaryProvider, // row owner = primary
      is_multiple: isMultiple,
      // Total attempts across providers
      success: successInc,
      failed: failedInc,
      other_provider_success_call: isPrimaryAttempt ? {} : { [provider]: { success: successInc } },
      other_provider_failed_call: isPrimaryAttempt ? {} : { [provider]: { failed: failedInc } },
      audit: [auditEvent],
      updated_at: nowIso,
      created_at: nowIso,
    });
    return;
  }

  // Provider-level counts in audit must always be per-provider (not global totals).
  // Derive from historical audit events, then add current attempt.
  const historicalProviderCounts = countProviderFromAudit(nextAuditBase, provider);
  const providerSuccessCount = historicalProviderCounts.success + successInc;
  const providerFailedCount = historicalProviderCounts.failed + failedInc;

  const auditEvent: AuditEvent = {
    ts: nowIso,
    provider,
    role: isPrimaryAttempt ? "primary" : "fallback",
    result: isSuccess ? "success" : "failed",
    total_counts_after: {
      success: nextMainSuccess,
      failed: nextMainFailed,
    },
    provider_counts_after: {
      success: providerSuccessCount,
      failed: providerFailedCount,
    },
  };

  const nextAudit = [...nextAuditBase, auditEvent];

  await supabase.from("employee_verification_api_calls").update({
    success: nextMainSuccess,
    failed: nextMainFailed,
    other_provider_success_call: nextOtherSuccess,
    other_provider_failed_call: nextOtherFailed,
    audit: nextAudit,
    updated_at: nowIso,
  }).eq("id", existing.id);
}

