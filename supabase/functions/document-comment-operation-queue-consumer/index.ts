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

type CommentData = {
  text: string;
  sentiment: boolean;
  filePaths?: string[]; // Legacy: Array of storage paths
  files?: CommentFile[]; // New: Array of file objects with path and fileName
};

type Job = {
  operation: 'update' | 'delete';
  documentId: string;
  clientId: string;
  employeeId: string;
  commentId: string;
  comment?: CommentData; // Required for update operation
  filesToDelete?: string[]; // Files to delete from storage
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
      queue_name: "document_comment_operation",
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
    const bucketName = 'employee_other_type_statement';

    console.log("Processing document comment operation messages:", messages);

    for (const m of messages as Array<{ msg_id: number; message: Job }>) {
      const job = m.message;
      const { operation, documentId, clientId, employeeId, commentId, comment, filesToDelete } = job;

      if (!documentId || !clientId || !employeeId || !commentId || !operation) {
        // Drop bad message
        await supabase.rpc("pgmq_delete", {
          queue_name: "document_comment_operation",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Validate operation-specific requirements
      if (operation === 'update' && !comment) {
        console.error(`Update operation requires comment data, skipping`);
        await supabase.rpc("pgmq_delete", {
          queue_name: "document_comment_operation",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Get the existing document record
      const { data: documentRecord, error: findErr } = await supabase
        .from("employee_documents")
        .select("id, comments")
        .eq("id", documentId)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!documentRecord) {
        console.error(`Document ${documentId} not found, skipping`);
        await supabase.rpc("pgmq_delete", {
          queue_name: "document_comment_operation",
          msg_id: m.msg_id,
        });
        continue;
      }

      // Get existing comments or initialize as empty array
      const existingComments = Array.isArray(documentRecord.comments) ? documentRecord.comments : [];

      if (operation === 'delete') {
        // Delete operation: remove comment from array and delete files from storage
        const updatedComments = existingComments.filter((c: any) => c.id !== commentId);

        // Delete files from storage
        if (filesToDelete && filesToDelete.length > 0) {
          const { error: deleteErr } = await supabase.storage
            .from(bucketName)
            .remove(filesToDelete);

          if (deleteErr) {
            console.error(`Error deleting files for comment ${commentId}:`, deleteErr);
            // Continue with comment deletion even if file deletion fails
          } else {
            console.log(`Successfully deleted ${filesToDelete.length} file(s) for comment ${commentId}`);
          }
        }

        // Update document with updated comments array
        const { error: updateErr } = await supabase
          .from("employee_documents")
          .update({
            comments: updatedComments,
            updated_at: new Date().toISOString()
          })
          .eq("id", documentId);

        if (updateErr) {
          console.error(`Error updating document ${documentId} for delete operation:`, updateErr);
          // Don't delete message on error, let it retry
          continue;
        }

        console.log(`Successfully deleted comment ${commentId} from document ${documentId}`);
      } else if (operation === 'update') {
        // Update operation: replace comment in array and handle file deletions
        const commentIndex = existingComments.findIndex((c: any) => c.id === commentId);
        
        if (commentIndex === -1) {
          console.error(`Comment ${commentId} not found in document ${documentId}, skipping`);
          await supabase.rpc("pgmq_delete", {
            queue_name: "document_comment_operation",
            msg_id: m.msg_id,
          });
          continue;
        }

        // Delete old files from storage if specified
        if (filesToDelete && filesToDelete.length > 0) {
          const { error: deleteErr } = await supabase.storage
            .from(bucketName)
            .remove(filesToDelete);

          if (deleteErr) {
            console.error(`Error deleting old files for comment ${commentId}:`, deleteErr);
            // Continue with comment update even if file deletion fails
          } else {
            console.log(`Successfully deleted ${filesToDelete.length} old file(s) for comment ${commentId}`);
          }
        }

        // Update the comment in the array
        const updatedComments = [...existingComments];
        // Support both new structure (files) and legacy structure (filePaths)
        if (comment!.files && Array.isArray(comment!.files)) {
          updatedComments[commentIndex] = {
            id: commentId,
            text: comment!.text,
            sentiment: comment!.sentiment,
            files: comment!.files // New structure with path and fileName
          };
        } else if (comment!.filePaths && Array.isArray(comment!.filePaths)) {
          // Legacy: convert filePaths to files structure
          updatedComments[commentIndex] = {
            id: commentId,
            text: comment!.text,
            sentiment: comment!.sentiment,
            files: comment!.filePaths.map((path: string) => {
              const parts = path.split('/');
              const fileName = parts[parts.length - 1] || 'file';
              return {
                path: path,
                fileName: fileName
              };
            })
          };
        } else {
          updatedComments[commentIndex] = {
            id: commentId,
            text: comment!.text,
            sentiment: comment!.sentiment,
            files: []
          };
        }

        // Update document with updated comments array
        const { error: updateErr } = await supabase
          .from("employee_documents")
          .update({
            comments: updatedComments,
            updated_at: new Date().toISOString()
          })
          .eq("id", documentId);

        if (updateErr) {
          console.error(`Error updating document ${documentId} for update operation:`, updateErr);
          // Don't delete message on error, let it retry
          continue;
        }

        console.log(`Successfully updated comment ${commentId} in document ${documentId}`);
      }

      // Delete message after successful processing
      await supabase.rpc("pgmq_delete", {
        queue_name: "document_comment_operation",
        msg_id: m.msg_id,
      });

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error in document comment operation consumer:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

