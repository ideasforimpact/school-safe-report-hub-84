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

    // Get the row to check if it's a folder or root file
    const { data: row, error: selErr } = await supabaseAdmin
      .from("compliance_documents")
      .select("id, files, folder_exists")
      .eq("id", rowId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!row) throw new Error("Row not found");

    // Case 1: File inside a folder (folder_exists = true)
    // Remove the file from the files array, don't set is_delete = 1
    if (row.folder_exists === true) {
      const isNested = Array.isArray(row.files?.[0]?.files);
      const current = isNested ? (row.files[0].files ?? []) : (row.files ?? []);
      
      // Remove the file from the array (filter it out)
      const nextFiles = current.filter((f: any) => {
        const p = f?.path || "";
        if (p === path || (fileName && f?.fileName === fileName)) {
          return false; // Remove this file
        }
        return true; // Keep this file
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
    } 
    // Case 2: Root file (folder_exists = false)
    // Set is_delete = 1 on the row
    else {
      const { error: updErr } = await supabaseAdmin
        .from("compliance_documents")
        .update({ is_delete: 1 })
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
















