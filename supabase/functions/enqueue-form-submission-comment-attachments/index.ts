import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FilePayload = {
  path: string;
  filename: string;
  size?: number;
};

type EnqueuePayload = {
  submission_id: string;
  comments: string | null;
  files: FilePayload[];
};

// Producer function for grievance acknowledgement evidence
// Enqueues jobs to Supabase Queue `form_submission_comment_attachements`
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EnqueuePayload;

    if (!payload?.submission_id) {
      return new Response(
        JSON.stringify({ success: false, message: "submission_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Enqueue job via SQL helper (pgmq)
    const { error: enqueueError } = await supabaseAdmin.rpc("queue_form_submission_comment_attachments", {
      p_submission_id: payload.submission_id,
      p_comments: payload.comments,
      p_files: payload.files,
    });

    if (enqueueError) {
      console.error("Error enqueuing acknowledgement evidence job:", enqueueError);
      throw enqueueError;
    }

    // Trigger consumer for near real-time processing (non-fatal if it fails)
    try {
      await (supabaseAdmin as any).functions.invoke("process-comment-attachments", {
        body: { qty: 25, vt: 60 },
      });
    } catch (consumeErr) {
      console.error("Failed to trigger process-comment-attachments consumer:", consumeErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("Error in enqueue-form-submission-comment-attachments:", err);
    return new Response(
      JSON.stringify({ success: false, message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});



