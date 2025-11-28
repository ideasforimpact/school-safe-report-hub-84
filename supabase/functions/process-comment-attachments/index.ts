import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";

const QUEUE_NAME = "form_submission_comment_attachements";
const BUCKET_ID = "form_submission_comment_attachements";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JobPayload = {
  submission_id: string;
  comments: string | null;
  files: Array<{ path: string; filename: string; size?: number }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

  try {
    const { qty = 25, vt = 60 } = (await req.json().catch(() => ({}))) as { qty?: number; vt?: number };

    // Read a batch of messages from the queue
    const { data: messages, error: readErr } = await supabaseClient.rpc("pgmq_read", {
      queue_name: QUEUE_NAME,
      vt,
      qty,
    });

    if (readErr) {
      console.error("Error reading from queue:", readErr);
      return new Response(
        JSON.stringify({ error: "Failed to read messages from queue" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!messages || (messages as any[]).length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;

    for (const m of messages as Array<{ msg_id: number; message: JobPayload }>) {
      const payload = m.message;
      const { submission_id, comments, files } = payload || {};

      if (!submission_id) {
        // Bad message: drop it
        await supabaseClient.rpc("pgmq_delete", { queue_name: QUEUE_NAME, msg_id: m.msg_id });
        continue;
      }

      const evidence: Array<{ filename: string; url: string; path: string; size?: number }> = [];

      if (files && files.length > 0) {
        for (const f of files) {
          if (!f.path || !f.filename) continue;
          const objectPath = f.path;
          const fullPath = `${BUCKET_ID}/${objectPath}`;
          // Store only the storage path (no public URL) under both url and path
          evidence.push({
            filename: f.filename,
            url: fullPath,
            path: fullPath,
            size: f.size,
          });
        }
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (comments !== undefined) {
        updateData.comments = comments;
      }

      if (evidence.length > 0) {
        updateData.comments_attachment = evidence;
      }

      const { error: updateError } = await supabaseClient
        .from("form_submissions")
        .update(updateData)
        .eq("id", submission_id);

      if (updateError) {
        console.error("Error updating form_submissions for comment attachments:", updateError);
        // Do not ack message so it can be retried
        continue;
      }

      // Ack the message on success
      const { error: delErr } = await supabaseClient.rpc("pgmq_delete", {
        queue_name: QUEUE_NAME,
        msg_id: m.msg_id,
      });

      if (delErr) {
        console.error("Error deleting message from queue:", delErr);
        continue;
      }

      processed++;
    }

    return new Response(
      JSON.stringify({ processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in process-comment-attachments function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

