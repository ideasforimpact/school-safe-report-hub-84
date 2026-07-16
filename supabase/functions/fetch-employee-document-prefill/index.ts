import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../_shared/env.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maps an employee_document_type.name (Employee Verification) to the
// compliance document key used by the Users module
// (src/constants/employeeComplianceDocuments.ts) when an employee is created.
const PROFILE_DOCUMENT_KEY_BY_TYPE: Record<string, string> = {
  aadhar: "aadhaarCard",
  pan: "panCard",
  passport: "passport",
};

const PROFILE_DOCUMENTS_BUCKET = "employee_profile_documents";

function blobToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
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
    const documentType = String(body?.documentType || "").trim();

    if (!employeeId || !documentType) {
      return new Response(
        JSON.stringify({ success: false, error: "employeeId and documentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileDocKey = PROFILE_DOCUMENT_KEY_BY_TYPE[documentType];
    if (!profileDocKey) {
      // Not a compliance document type collected at employee creation -
      // nothing to prefill.
      return new Response(
        JSON.stringify({ success: true, found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let employeeQuery = supabaseClient
      .from("employees")
      .select("id, client_id, documents")
      .eq("id", employeeId);

    if (clientId) {
      employeeQuery = employeeQuery.eq("client_id", clientId);
    }

    const { data: employeeRow, error: employeeError } = await employeeQuery.maybeSingle();

    if (employeeError) {
      console.error("Error fetching employee for document prefill:", employeeError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch employee" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employeeRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileDocuments = Array.isArray((employeeRow as any).documents)
      ? (employeeRow as any).documents
      : [];
    const profileDoc = profileDocuments.find((doc: any) => doc?.key === profileDocKey);
    const storagePath = profileDoc?.filePath || profileDoc?.file_path;

    if (!storagePath) {
      return new Response(
        JSON.stringify({ success: true, found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: fileBlob, error: downloadError } = await supabaseClient.storage
      .from(PROFILE_DOCUMENTS_BUCKET)
      .download(storagePath);

    if (downloadError || !fileBlob) {
      console.error("Error downloading prefill document:", downloadError);
      return new Response(
        JSON.stringify({ success: true, found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64 = blobToBase64(arrayBuffer);
    const contentType = fileBlob.type || "application/octet-stream";

    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        file: {
          fileName: profileDoc?.fileName || "document",
          contentType,
          base64,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-employee-document-prefill function:", error);
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
