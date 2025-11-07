import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommentFile {
  path: string; // Storage path
  fileName: string; // Original file name
}

interface CommentEntry {
  id: string;
  text: string;
  sentiment: boolean; // true for positive, false for negative
  filePaths?: string[]; // Legacy: Array of storage paths (for backward compatibility)
  files?: CommentFile[]; // New: Array of file objects with path and fileName
}

interface QueuePayload {
  documentId: string;
  clientId: string;
  employeeId: string;
  action: 'completed' | 'rejected';
  comments: CommentEntry[];
}

// Producer function for backoffice document verification
// Enqueues verification jobs to Supabase Queue `backoffice_document_verification`
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const payload: QueuePayload = await req.json();

    console.log("Enqueue backoffice document verification payload:", payload);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Enqueue to Supabase Queue via SQL helper (pgmq)
    const { data: msgId, error } = await supabaseAdmin.rpc('enqueue_backoffice_document_verification', { job: payload });
    if (error) throw error;

    // Server-driven immediate processing: invoke the consumer after enqueue.
    // This keeps queue durability while providing near real-time UX.
    try {
      await (supabaseAdmin as any).functions.invoke('backoffice-document-verification-queue-consumer', {
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
    return new Response(JSON.stringify({ success: false, message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

