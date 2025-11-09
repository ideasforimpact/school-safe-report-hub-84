import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeletePayload = {
  clientId: string;
  rowId: string; // compliance_documents.id
  path: string; // full storage path inside bucket
  fileName?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as DeletePayload;
    const { clientId, rowId, path } = body || ({} as DeletePayload);
    const fileName = body?.fileName ?? null;

    if (!clientId || !rowId || !path) {
      return new Response(
        JSON.stringify({ success: false, message: "clientId, rowId and path are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const bucketName = "compliance_documents";

    // 1) Delete file from Storage
    const { error: remErr } = await supabaseAdmin.storage.from(bucketName).remove([path]);
    if (remErr) throw remErr;

    // 2) Remove from DB row.files
    const { data: row, error: selErr } = await supabaseAdmin
      .from("compliance_documents")
      .select("id, files")
      .eq("id", rowId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!row) throw new Error("Row not found");

    const isNested = Array.isArray(row.files?.[0]?.files);
    const current = isNested ? (row.files[0].files ?? []) : (row.files ?? []);
    const nextFiles = current.filter((f: any) => {
      const p = f?.path || "";
      if (p === path) return false;
      if (fileName && f?.fileName === fileName) return false;
      return true;
    });

    if (isNested) {
      const next = [
        {
          folder_name: row.files?.[0]?.folder_name ?? "Folder",
          files: nextFiles,
        },
      ];
      const { error: updErr } = await supabaseAdmin
        .from("compliance_documents")
        .update({ files: next })
        .eq("id", rowId);
      if (updErr) throw updErr;
    } else {
      const { error: updErr } = await supabaseAdmin
        .from("compliance_documents")
        .update({ files: nextFiles })
        .eq("id", rowId);
      if (updErr) throw updErr;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});







