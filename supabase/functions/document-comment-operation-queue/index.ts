import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommentData {
  text: string;
  sentiment: boolean;
  filePaths: string[];
}

interface QueuePayload {
  operation: 'update' | 'delete';
  documentId: string;
  clientId: string;
  employeeId: string;
  commentId: string;
  comment?: CommentData; // Required for update operation
  filesToDelete?: string[]; // Files to delete from storage
}

// Producer function for document comment operations
// Enqueues comment operation jobs to Supabase Queue `document_comment_operation`
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const payload: QueuePayload = await req.json();

    console.log("Enqueue document comment operation payload:", payload);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Enqueue to Supabase Queue via SQL helper (pgmq)
    const { data: msgId, error } = await supabaseAdmin.rpc('enqueue_document_comment_operation', { job: payload });
    if (error) throw error;

    // Server-driven immediate processing: invoke the consumer after enqueue.
    // This keeps queue durability while providing near real-time UX.
    try {
      await (supabaseAdmin as any).functions.invoke('document-comment-operation-queue-consumer', {
        body: { qty: 25, vt: 30 },
      });
    } catch (consumeErr) {
      // Non-fatal. Message remains in queue for a later run.
      console.error('Failed to trigger consumer:', consumeErr);
    }

    return new Response(JSON.stringify({ success: true, message_id: msgId }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.log(err,"errMsg");
    
    return new Response(JSON.stringify({ success: false, message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

