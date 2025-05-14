
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // CORS handling for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    )

    // Parse request URL and body
    const { pathname } = new URL(req.url);
    const requestData = await req.json();

    // Handle different HTTP methods and endpoints
    if (req.method === 'GET') {
      // Handle GET request to fetch documents for an employee
      const employeeId = requestData.employeeId;
      if (!employeeId) {
        return new Response(
          JSON.stringify({ error: "Employee ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Fetch documents for the employee
      const { data: documents, error } = await supabaseClient
        .from('employee_documents')
        .select('*, employee_document_type(name)')
        .eq('employee_id', employeeId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Process documents to add documentTypeName
      const processedDocuments = documents.map(doc => ({
        ...doc,
        documentTypeName: doc.employee_document_type?.name || null,
        documentImage: doc.document_url, // Map document_url to documentImage for frontend compatibility
      }));

      return new Response(
        JSON.stringify({ documents: processedDocuments }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );

    } else if (req.method === 'POST') {
      // Handle document creation
      const { employeeId, documentData } = requestData;
      
      if (!employeeId || !documentData) {
        return new Response(
          JSON.stringify({ error: "Employee ID and document data are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Insert new document
      const { data: newDocument, error } = await supabaseClient
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          document_type_id: documentData.documentTypeId,
          document_number: documentData.documentNumber,
          document_url: documentData.documentImage,
          document_status_id: documentData.documentStatusId,
          verification_status: 'pending'
        })
        .select('*, employee_document_type(name)')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Get document type name
      const documentTypeName = newDocument.employee_document_type?.name;

      // Format response
      const formattedDocument = {
        ...newDocument,
        documentTypeName,
        documentImage: newDocument.document_url,
      };

      return new Response(
        JSON.stringify({ document: formattedDocument }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );

    } else if (req.method === 'PUT') {
      // Handle document update/verification
      const { employeeId, documentId, verificationStatus, verificationNotes, documentStatusId, skipLogUpdate } = requestData;
      
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // If employeeId is not provided, get it from the document
      let finalEmployeeId = employeeId;
      if (!finalEmployeeId) {
        const { data: docData, error: docError } = await supabaseClient
          .from('employee_documents')
          .select('employee_id')
          .eq('id', documentId)
          .single();
        
        if (docError) {
          return new Response(
            JSON.stringify({ error: "Could not find document" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }
        
        finalEmployeeId = docData.employee_id;
      }

      // Prepare update data
      const updateData: any = {
        verification_status: verificationStatus
      };

      // Add document status ID if provided
      if (documentStatusId) {
        updateData.document_status_id = documentStatusId;
      }

      // Prepare the document update
      let updatePromise = supabaseClient
        .from('employee_documents')
        .update(updateData)
        .eq('id', documentId);

      // Execute update
      const { data: updatedDoc, error: updateError } = await updatePromise;

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Update employee_docs_log if skipLogUpdate is not true
      if (!skipLogUpdate && verificationNotes) {
        // Get current document
        const { data: currentDoc, error: fetchError } = await supabaseClient
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: "Could not fetch current document logs" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }

        // Create log entry
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: 'manual_verification',
          notes: verificationNotes,
          user: "staff" // Could be dynamic based on authenticated user
        };

        // Update logs
        const logs = Array.isArray(currentDoc.employee_docs_log) 
          ? [...currentDoc.employee_docs_log, logEntry] 
          : [logEntry];

        const { error: logUpdateError } = await supabaseClient
          .from('employee_documents')
          .update({ employee_docs_log: logs })
          .eq('id', documentId);

        if (logUpdateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update document logs" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }

      // Check if we need to update employee status
      // Count documents for this employee
      const { data: documentCount, error: countError } = await supabaseClient
        .from('employee_documents')
        .select('verification_status')
        .eq('employee_id', finalEmployeeId);

      if (countError) {
        return new Response(
          JSON.stringify({ error: "Failed to check document count" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Determine employee status based on documents
      let employeeStatus = 'pending';
      const allDocuments = documentCount || [];
      
      if (allDocuments.length > 0) {
        const hasFailedDoc = allDocuments.some(doc => doc.verification_status === 'failed');
        const allVerified = allDocuments.every(doc => doc.verification_status === 'verified');
        
        if (hasFailedDoc) {
          employeeStatus = 'failed';
        } else if (allVerified) {
          employeeStatus = 'verified';
        }
      }

      // Update employee status
      const { error: employeeUpdateError } = await supabaseClient
        .from('employees')
        .update({ status: employeeStatus })
        .eq('id', finalEmployeeId);

      if (employeeUpdateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update employee status" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: employeeStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );

    } else if (req.method === 'DELETE') {
      // Handle document deletion
      const { documentId } = requestData;
      
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Delete document
      const { error } = await supabaseClient
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Return 405 Method Not Allowed for unsupported methods
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );

  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
