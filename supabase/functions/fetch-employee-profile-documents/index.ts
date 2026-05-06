import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../_shared/env.ts";

type MergedDocumentRow = {
  docKey: string;
  label: string;
  fileName: string;
  bucket?: string;
  storagePath?: string;
  source: "profile" | "verification";
};

const COMPLIANCE_DOCUMENT_SPECS = [
  { key: "letterOfAppointment", label: "Letter of Appointment" },
  { key: "marksheets10And12", label: "10th/12th Marksheets" },
  { key: "aadhaarCard", label: "Aadhaar Card" },
  { key: "panCard", label: "PAN Card" },
  { key: "passport", label: "Passport" },
  { key: "bankPassbook", label: "Bank Passbook" },
  { key: "esiProof", label: "ESI Number Proof" },
] as const;

function inferDocumentKey(doc: {
  key?: string;
  storagePath?: string;
  storage_path?: string;
  filePath?: string;
  file_path?: string;
  label?: string;
}) {
  const normalizedKey = (doc.key || "").toLowerCase().replace(/[\s_\-]/g, "");
  const normalizedLabel = (doc.label || "").toLowerCase().replace(/[\s_\-]/g, "");
  const byText = `${normalizedKey}|${normalizedLabel}`;
  if (normalizedKey || normalizedLabel) {
    if (byText.includes("letterofappointment") || byText.includes("appointmentletter")) return "letterOfAppointment";
    if (byText.includes("marksheet") || byText.includes("10th") || byText.includes("12th")) return "marksheets10And12";
    if (byText.includes("aadhaar") || byText.includes("aadhar")) return "aadhaarCard";
    if (byText.includes("pancard") || byText.includes("pan")) return "panCard";
    if (byText.includes("passport")) return "passport";
    if (byText.includes("bankpassbook") || byText.includes("passbook")) return "bankPassbook";
    if (byText.includes("esiproof") || byText.includes("esinumber") || byText.includes("esi")) return "esiProof";
  }
  const path = doc.storagePath || doc.storage_path || doc.filePath || doc.file_path || "";
  if (path.includes("/letterOfAppointment/")) return "letterOfAppointment";
  if (path.includes("/marksheets10And12/")) return "marksheets10And12";
  if (path.includes("/aadhaarCard/")) return "aadhaarCard";
  if (path.includes("/panCard/")) return "panCard";
  if (path.includes("/passport/")) return "passport";
  if (path.includes("/bankPassbook/")) return "bankPassbook";
  if (path.includes("/esiProof/")) return "esiProof";
  return "";
}

function getDisplayFileName(doc: {
  fileName?: string;
  file_name?: string;
  storagePath?: string;
  storage_path?: string;
  filePath?: string;
  file_path?: string;
  label?: string;
}) {
  if (doc.fileName && doc.fileName.trim()) return doc.fileName;
  if (doc.file_name && doc.file_name.trim()) return doc.file_name;
  const path = doc.storagePath || doc.storage_path || doc.filePath || doc.file_path || "";
  if (path) {
    const parts = path.split("/");
    const last = parts[parts.length - 1] || "";
    const derived = last.includes("_") ? last.substring(last.indexOf("_") + 1) : last;
    if (derived) return derived;
  }
  return doc.label || "Uploaded file";
}

function formatVerificationTypeName(raw: string) {
  return raw
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const body = await req.json().catch(() => ({}));
    const employeeId = String(body?.employeeId || "").trim();
    const clientId = String(body?.clientId || "").trim();

    if (!employeeId) {
      return new Response(
        JSON.stringify({ success: false, error: "employeeId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabaseClient
      .from("employees")
      .select("id, client_id, documents")
      .eq("id", employeeId);

    // Keep the fetch tenant-safe when client context is provided.
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: employeeRow, error } = await query.maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch employee documents" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employeeRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileDocuments = Array.isArray((employeeRow as any).documents) ? (employeeRow as any).documents : [];
    const mergedByKey: Record<string, MergedDocumentRow> = {};

    profileDocuments.forEach((doc: any) => {
      const docKey = inferDocumentKey(doc);
      if (!docKey) return;
      const spec = COMPLIANCE_DOCUMENT_SPECS.find((item) => item.key === docKey);
      mergedByKey[docKey] = {
        docKey,
        label: spec?.label || doc.label || "Document",
        fileName: getDisplayFileName(doc),
        bucket: "employee_profile_documents",
        storagePath:
          (doc as any).storagePath ||
          (doc as any).storage_path ||
          (doc as any).filePath ||
          (doc as any).file_path ||
          undefined,
        source: "profile",
      };
    });

    const { data: verificationRows } = await (supabaseClient as any)
      .from("employee_documents")
      .select("id, document_url, verification_status, document_type:employee_document_type(name)")
      .eq("employee_id", employeeId)
      .eq("is_delete", 0);

    (verificationRows || []).forEach((row: any) => {
      if (!row?.document_url) return;
      const typeName = row?.document_type?.name || "";
      const docKey = inferDocumentKey({ key: typeName });
      if (!docKey || mergedByKey[docKey]) return;
      const spec = COMPLIANCE_DOCUMENT_SPECS.find((item) => item.key === docKey);
      mergedByKey[docKey] = {
        docKey,
        label: spec?.label || formatVerificationTypeName(typeName || "document"),
        fileName: formatVerificationTypeName(typeName || "document"),
        source: "verification",
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        employeeId: employeeRow.id,
        clientId: employeeRow.client_id,
        profileDocuments,
        verificationDocuments: Array.isArray(verificationRows) ? verificationRows : [],
        mergedDocuments: Object.values(mergedByKey),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
