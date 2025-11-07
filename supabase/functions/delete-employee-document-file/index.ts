import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { clientId, employeeId, documentId, objectPath } = await req.json();
    if (!clientId || !employeeId || !documentId || !objectPath) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const bucket = "employee_other_documents";

    console.log(objectPath,"objectPath");
    

    // Remove from storage
    const { error: storageErr } = await supabase.storage.from(bucket).remove([objectPath]);
    if (storageErr) throw storageErr;

    // Fetch document
    const { data: doc, error: fetchErr } = await supabase
      .from("employee_documents")
      .select("id, documents_files")
      .eq("id", documentId)
      .single();
    if (fetchErr) throw fetchErr;
    if (!doc) throw new Error("Document not found");

    const docsFiles: any[] = Array.isArray((doc as any).documents_files) ? (doc as any).documents_files : [];
    const nextFiles = docsFiles.filter((f: any) => f?.objectPath !== objectPath);

    const { error: updErr } = await supabase
      .from("employee_documents")
      .update({ documents_files: nextFiles, updated_at: new Date().toISOString() })
      .eq("id", documentId);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
