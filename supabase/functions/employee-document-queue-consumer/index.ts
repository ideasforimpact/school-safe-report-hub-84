import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Job = {
  clientId: string;
  employeeId: string;
  documentId: string;
  files: Array<{
    objectPath: string;
    fileName: string;
    contentType?: string;
    size?: number;
  }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { qty = 25, vt = 30 } = (await req.json().catch(() => ({}))) as { qty?: number; vt?: number };

    // Read a batch from the queue via RPC wrapper
    const { data: messages, error: readErr } = await supabase.rpc("pgmq_read", {
      queue_name: "employee_document_uploads",
      vt,
      qty,
    });
    if (readErr) throw readErr;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let processed = 0;

    console.log(messages,"messages");
    
    for (const m of messages as Array<{ msg_id: number; message: Job }>) {
      const job = m.message;
      const { clientId, employeeId, documentId, files } = job;

      if (!clientId || !employeeId || !documentId || !files || files.length === 0) {
        // Drop bad message
        await supabase.rpc("pgmq_delete", {
          queue_name: "employee_document_uploads",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Get the existing document record (only documents_files is needed)
      const { data: documentRecord, error: findErr } = await supabase
        .from("employee_documents")
        .select("id, documents_files")
        .eq("id", documentId)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!documentRecord) {
        console.error(`Document ${documentId} not found, skipping`);
        await supabase.rpc("pgmq_delete", {
          queue_name: "employee_document_uploads",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Prepare new file objects with all metadata
      const newFileObjects = files.map((f) => ({
        objectPath: f.objectPath,
        fileName: f.fileName,
        contentType: f.contentType || 'application/octet-stream',
        size: f.size || 0,
        uploadedAt: new Date().toISOString(),
      }));

      // Merge with existing documents_files
      const existingFiles: any[] = Array.isArray((documentRecord as any).documents_files)
        ? (documentRecord as any).documents_files
        : [];
      const allFiles = [...existingFiles, ...newFileObjects];

      // Persist only documents_files
      const { error: updErr } = await supabase
        .from("employee_documents")
        .update({ documents_files: allFiles, updated_at: new Date().toISOString() })
        .eq("id", documentId);

      if (updErr) throw updErr;

      // Ack on success
      const { error: delErr } = await supabase.rpc("pgmq_delete", {
        queue_name: "employee_document_uploads",
        msg_id: m.msg_id,
      });
      if (delErr) throw delErr;
      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

