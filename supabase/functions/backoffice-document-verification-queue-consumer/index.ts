import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CommentFile = {
  path: string; // Storage path
  fileName: string; // Original file name
};

type CommentEntry = {
  id: string;
  text: string;
  sentiment: boolean; // true for positive, false for negative
  filePaths?: string[]; // Legacy: Array of storage paths (for backward compatibility)
  files?: CommentFile[]; // New: Array of file objects with path and fileName
};

type Job = {
  documentId: string;
  clientId: string;
  employeeId: string;
  action: 'completed' | 'rejected';
  comments: CommentEntry[];
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
      queue_name: "backoffice_document_verification",
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

    console.log("Processing backoffice document verification messages:", messages);

    for (const m of messages as Array<{ msg_id: number; message: Job }>) {
      const job = m.message;
      const { documentId, clientId, employeeId, action, comments } = job;

      if (!documentId || !clientId || !employeeId || !action || !comments || comments.length === 0) {
        // Drop bad message
        await supabase.rpc("pgmq_delete", {
          queue_name: "backoffice_document_verification",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Get the existing document record
      const { data: documentRecord, error: findErr } = await supabase
        .from("employee_documents")
        .select("id, comments, params")
        .eq("id", documentId)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!documentRecord) {
        console.error(`Document ${documentId} not found, skipping`);
        await supabase.rpc("pgmq_delete", {
          queue_name: "backoffice_document_verification",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Get status ID based on action
      const statusName = action === 'completed' ? 'completed' : 'rejected';
      const { data: status, error: statusErr } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', statusName)
        .single();

      if (statusErr || !status) {
        console.error(`${statusName} status not found, skipping`);
        await supabase.rpc("pgmq_delete", {
          queue_name: "backoffice_document_verification",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Prepare comment objects for storage
      const commentObjects = comments.map(comment => {
        // Support both new structure (files) and legacy structure (filePaths)
        if (comment.files && Array.isArray(comment.files)) {
          return {
            id: comment.id,
            text: comment.text,
            sentiment: comment.sentiment,
            files: comment.files // New structure with path and fileName
          };
        } else if (comment.filePaths && Array.isArray(comment.filePaths)) {
          // Legacy: convert filePaths to files structure for consistency
          return {
            id: comment.id,
            text: comment.text,
            sentiment: comment.sentiment,
            files: comment.filePaths.map((path: string) => {
              // Extract filename from path for legacy entries
              const parts = path.split('/');
              const fileName = parts[parts.length - 1] || 'file';
              return {
                path: path,
                fileName: fileName
              };
            })
          };
        } else {
          return {
            id: comment.id,
            text: comment.text,
            sentiment: comment.sentiment,
            files: []
          };
        }
      });

      // Get existing comments or initialize as empty array
      const existingComments = Array.isArray(documentRecord.comments) ? documentRecord.comments : [];
      
      // Append new comments to existing ones
      const updatedComments = [...existingComments, ...commentObjects];

      // Get existing params for verification history
      const existingParams = (documentRecord.params as Record<string, any>) || {};
      const history: any[] = existingParams.verification_history || [];
      
      // Add verification history entry
      const entry = {
        action,
        timestamp: new Date().toISOString(),
        verified_by: 'SafeSchool',
        comments: comments.map(c => ({ id: c.id, text: c.text, sentiment: c.sentiment }))
      };
      const updatedParams = { ...existingParams, verification_history: [...history, entry] };

      // Update the document with comments and status
      const { error: updateErr } = await supabase
        .from("employee_documents")
        .update({
          comments: updatedComments,
          verification_status: action,
          document_status_id: status.id,
          params: updatedParams,
          updated_at: new Date().toISOString()
        })
        .eq("id", documentId);

      if (updateErr) {
        console.error(`Error updating document ${documentId}:`, updateErr);
        // Don't delete message on error, let it retry
        continue;
      }

      // Delete message after successful processing
      await supabase.rpc("pgmq_delete", {
        queue_name: "backoffice_document_verification",
        msg_id: m.msg_id,
      });

      processed++;
      console.log(`Successfully processed document verification for ${documentId}`);
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error in backoffice document verification consumer:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

