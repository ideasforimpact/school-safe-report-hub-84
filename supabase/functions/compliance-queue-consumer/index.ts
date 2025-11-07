import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Job = {
  clientId: string;
  employeeId?: string | null;
  parentFolderId?: string | null;
  folderName?: string | null;
  objectPath: string;
  fileName: string;
  contentType?: string | null;
  size?: number | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { qty = 25, vt = 30 } = (await req.json().catch(() => ({}))) as { qty?: number; vt?: number };

    // Read a batch from the queue via RPC wrapper
    const { data: messages, error: readErr } = await supabaseAdmin.rpc("pgmq_read", {
      queue_name: "compliance_uploads",
      vt,
      qty,
    });
    if (readErr) throw readErr;

    let processed = 0;

    console.log(messages,"messages");
    

    for (const m of (messages ?? []) as Array<{ msg_id: number; message: Job }>) {
      const job = m.message;
      const clientId = job.clientId;
      const employeeId = job.employeeId ?? null;
      const parentFolderId = job.parentFolderId ?? null;
      const folderName = job.folderName ?? null;
      const objectPath = job.objectPath;
      const fileName = job.fileName;
      const contentType = job.contentType ?? "application/octet-stream";
      const size = job.size ?? null;

      if (!clientId || !objectPath || !fileName) {
        // drop bad message
        await supabaseAdmin.rpc("pgmq_delete", { queue_name: "compliance_uploads", msg_id: m.msg_id });
        continue;
      }

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
              created_by: employeeId,
            });
          if (insErr) throw insErr;
        }
      } else {
        const { error: insErr } = await supabaseAdmin
          .from("compliance_documents")
          .insert({
            client_id: clientId,
            folder_exists: false,
            folder_id: null,
            files: [
              { path: objectPath, parentFolderId: null, fileName, contentType, size, uploaded_at: new Date().toISOString() },
            ],
            created_by: employeeId,
          });
        if (insErr) throw insErr;
      }

      // ack on success
      const { error: delErr } = await supabaseAdmin.rpc("pgmq_delete", { queue_name: "compliance_uploads", msg_id: m.msg_id });
      if (delErr) throw delErr;
      processed++;
    }

    return new Response(JSON.stringify({ processed }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});


