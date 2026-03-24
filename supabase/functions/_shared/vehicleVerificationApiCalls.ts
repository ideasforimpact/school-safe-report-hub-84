// @ts-nocheck
/**
 * Persists per-vehicle API attempt metrics to `vehicle_verification_api_calls`.
 * Mirrors employee_verification_api_calls: totals include all providers; fallback-only
 * counts go to other_provider_*; audit_log is an append-only event array.
 *
 * Primary / fallback must match vehicle-verify/index.ts routing (currently SurePass primary, QuickEKYC fallback).
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

export type VehicleApiOperation = "rc" | "challan";

export type RecordVehicleVerificationApiCallInput = {
  supabase: SupabaseClient;
  clientId?: string | null;
  employeeId?: string | null;
  vehicleId: string;
  /** RC or Challan API attempt */
  operation: VehicleApiOperation;
  /** Provider that actually executed this HTTP call */
  provider: string;
  /** Integration treated as primary in this edge function (counts in main rc_* / challan_* for primary attempts; same totals for all — see below) */
  primaryProvider: string;
  /** True when more than one provider is involved over time for this vehicle row */
  isMultiple?: boolean;
  /** Outcome based only on the external API response */
  isSuccess: boolean;
};

function toObjectOrEmpty(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v !== "object" || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function getNestedNumber(v: unknown, nestedKey: string): number {
  if (!v || typeof v !== "object" || Array.isArray(v)) return 0;
  const obj = v as Record<string, unknown>;
  return typeof obj[nestedKey] === "number" ? (obj[nestedKey] as number) : 0;
}

type VehicleAuditEvent = {
  ts: string;
  provider: string;
  role: "primary" | "fallback";
  operation: VehicleApiOperation;
  result: "success" | "failed";
  rc_counts_after: { success: number; failed: number };
  challan_counts_after: { success: number; failed: number };
};

function normalizeAuditLog(existing: unknown): VehicleAuditEvent[] {
  if (!existing) return [];
  if (!Array.isArray(existing)) return [];
  return existing
    .filter((x) => x && typeof x === "object")
    .map((x: any) => ({
      ts: String(x.ts ?? new Date().toISOString()),
      provider: String(x.provider ?? "unknown"),
      role: x.role === "fallback" ? "fallback" : "primary",
      operation: x.operation === "challan" ? "challan" : "rc",
      result: x.result === "success" ? "success" : "failed",
      rc_counts_after: {
        success: Number(x?.rc_counts_after?.success ?? 0),
        failed: Number(x?.rc_counts_after?.failed ?? 0),
      },
      challan_counts_after: {
        success: Number(x?.challan_counts_after?.success ?? 0),
        failed: Number(x?.challan_counts_after?.failed ?? 0),
      },
    }));
}

export async function recordVehicleVerificationApiCall(
  input: RecordVehicleVerificationApiCallInput,
): Promise<void> {
  const {
    supabase,
    vehicleId,
    operation,
    provider,
    primaryProvider,
    isSuccess,
  } = input;

  if (!vehicleId) {
    console.warn("recordVehicleVerificationApiCall: vehicleId missing, skipping");
    return;
  }

  let clientId = input.clientId ?? null;
  let employeeId = input.employeeId ?? null;

  if (!clientId || employeeId === undefined) {
    const { data: vehicleRow, error: vehicleError } = await supabase
      .from("vehicles")
      .select("client_id, employee_id")
      .eq("id", vehicleId)
      .maybeSingle();

    if (vehicleError) {
      console.error("recordVehicleVerificationApiCall: vehicles lookup failed", vehicleError);
      return;
    }
    if (!clientId) clientId = vehicleRow?.client_id ?? null;
    if (employeeId === undefined || employeeId === null) employeeId = vehicleRow?.employee_id ?? null;
  }

  if (!clientId) {
    console.warn("recordVehicleVerificationApiCall: client_id missing, skipping", { vehicleId });
    return;
  }

  const nowIso = new Date().toISOString();
  const isPrimaryAttempt = String(provider).toLowerCase() === String(primaryProvider).toLowerCase();
  const successInc = isSuccess ? 1 : 0;
  const failedInc = isSuccess ? 0 : 1;

  const { data: existing, error: findError } = await supabase
    .from("vehicle_verification_api_calls")
    .select(
      "id, rc_success, rc_failed, challan_success, challan_failed, audit_log, other_provider_success_call, other_provider_failed_call, is_multiple",
    )
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  const nextAuditBase = normalizeAuditLog(existing?.audit_log);
  const nextOtherSuccess = toObjectOrEmpty(existing?.other_provider_success_call);
  const nextOtherFailed = toObjectOrEmpty(existing?.other_provider_failed_call);

  let rcS = Number(existing?.rc_success ?? 0);
  let rcF = Number(existing?.rc_failed ?? 0);
  let chS = Number(existing?.challan_success ?? 0);
  let chF = Number(existing?.challan_failed ?? 0);

  if (operation === "rc") {
    rcS += successInc;
    rcF += failedInc;
  } else {
    chS += successInc;
    chF += failedInc;
  }

  if (existing && !isPrimaryAttempt) {
    const curSuccessObj = nextOtherSuccess[String(provider)] ?? {};
    const curFailedObj = nextOtherFailed[String(provider)] ?? {};
    const curProviderSuccess = getNestedNumber(curSuccessObj, "success");
    const curProviderFailed = getNestedNumber(curFailedObj, "failed");
    (nextOtherSuccess as any)[String(provider)] = { success: curProviderSuccess + successInc };
    (nextOtherFailed as any)[String(provider)] = { failed: curProviderFailed + failedInc };
  }

  const isMultipleFlag =
    Boolean(input.isMultiple) ||
    Boolean(existing?.is_multiple) ||
    !isPrimaryAttempt;

  const auditEvent: VehicleAuditEvent = {
    ts: nowIso,
    provider,
    role: isPrimaryAttempt ? "primary" : "fallback",
    operation,
    result: isSuccess ? "success" : "failed",
    rc_counts_after: { success: rcS, failed: rcF },
    challan_counts_after: { success: chS, failed: chF },
  };

  if (!existing) {
    await supabase.from("vehicle_verification_api_calls").insert({
      client_id: clientId,
      employee_id: employeeId,
      vehicle_id: vehicleId,
      provider: primaryProvider,
      is_multiple: isMultipleFlag,
      current_provider: provider,
      rc_success: operation === "rc" ? successInc : 0,
      rc_failed: operation === "rc" ? failedInc : 0,
      challan_success: operation === "challan" ? successInc : 0,
      challan_failed: operation === "challan" ? failedInc : 0,
      other_provider_success_call: isPrimaryAttempt ? {} : { [provider]: { success: successInc } },
      other_provider_failed_call: isPrimaryAttempt ? {} : { [provider]: { failed: failedInc } },
      audit_log: [auditEvent],
      updated_at: nowIso,
      created_at: nowIso,
    });
    return;
  }

  const nextAudit = [...nextAuditBase, auditEvent];

  await supabase
    .from("vehicle_verification_api_calls")
    .update({
      rc_success: rcS,
      rc_failed: rcF,
      challan_success: chS,
      challan_failed: chF,
      other_provider_success_call: nextOtherSuccess,
      other_provider_failed_call: nextOtherFailed,
      audit_log: nextAudit,
      is_multiple: isMultipleFlag,
      current_provider: provider,
      updated_at: nowIso,
    })
    .eq("id", existing.id);
}

/** Primary / fallback labels — keep in sync with vehicle-verify/index.ts call order */
export const VEHICLE_VERIFY_PRIMARY_PROVIDER = "surepass";
export const VEHICLE_VERIFY_FALLBACK_PROVIDER = "quickeyc";
