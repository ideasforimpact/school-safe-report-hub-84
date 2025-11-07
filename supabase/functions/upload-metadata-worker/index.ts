import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      clientId,
      employeeId,
      parentFolderId, // nullable
      folderName, // required when parentFolderId is provided (used for display if needed)
      objectPath, // full storage object path within bucket
      fileName,
      contentType,
      size,
    } = body as {
      clientId: string;
      employeeId?: string | null;
      parentFolderId?: string | null;
      folderName?: string | null;
      objectPath: string;
      fileName: string;
      contentType?: string;
      size?: number;
    };

    if (!clientId || !objectPath || !fileName) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Append the file metadata into the appropriate compliance_documents row
    if (parentFolderId) {
      const { data: folderRow, error: findErr } = await supabaseAdmin
        .from("compliance_documents")
        .select("id, files")
        .eq("client_id", clientId)
        .eq("folder_id", parentFolderId)
        .maybeSingle();
      if (findErr) throw findErr;

      if (folderRow) {
        let nextFiles: any;
        if (Array.isArray(folderRow.files) && folderRow.files[0]?.files && Array.isArray(folderRow.files[0].files)) {
          const inner = folderRow.files[0].files ?? [];
          nextFiles = [
            {
              folder_name: folderName ?? folderRow.files[0].folder_name ?? "Folder",
              files: inner.concat([
                { path: objectPath, parentFolderId, fileName, contentType, size, uploaded_at: new Date().toISOString() },
              ]),
            },
          ];
        } else {
          nextFiles = (folderRow.files ?? []).concat([
            { path: objectPath, parentFolderId, fileName, contentType, size, uploaded_at: new Date().toISOString() },
          ]);
        }
        const { error: updErr } = await supabaseAdmin
          .from("compliance_documents")
          .update({ files: nextFiles })
          .eq("id", folderRow.id);
        if (updErr) throw updErr;
      } else {
        // If no row exists for this folder, create one
        const { error: insErr } = await supabaseAdmin
          .from("compliance_documents")
          .insert({
            client_id: clientId,
            folder_exists: true,
            folder_id: parentFolderId,
            files: [
              {
                folder_name: folderName ?? "Folder",
                files: [
                  { path: objectPath, parentFolderId, fileName, contentType, size, uploaded_at: new Date().toISOString() },
                ],
              },
            ],
            created_by: employeeId ?? null,
          });
        if (insErr) throw insErr;
      }
    } else {
      // No folder: create a standalone row (legacy flat files bucket)
      const { error: insErr } = await supabaseAdmin
        .from("compliance_documents")
        .insert({
          client_id: clientId,
          folder_exists: false,
          folder_id: null,
          files: [
            { path: objectPath, parentFolderId: null, fileName, contentType, size, uploaded_at: new Date().toISOString() },
          ],
          created_by: employeeId ?? null,
        });
      if (insErr) throw insErr;
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


