
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle document operations based on the method
  try {
    // Use POST method for both listing documents and uploading
    if (req.method === "POST") {
      const body = await req.json();
      const { employeeId, documentData } = body;
      
      // If documentData is provided, it's an upload operation
      if (documentData) {
        return await handleDocumentUpload(employeeId, documentData, supabase, corsHeaders);
      } 
      // Otherwise it's a list operation
      else if (employeeId) {
        return await handleListDocuments(employeeId, supabase, corsHeaders);
      }
      else {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // DELETE operation with proper CORS headers
    if (req.method === "DELETE") {
      const body = await req.json();
      const { employeeId, documentId } = body;
      return await handleDocumentDelete(employeeId, documentId, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleDocumentUpload(employeeId, documentData, supabase, corsHeaders) {
  if (!employeeId || !documentData) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // Check if document entry exists for this employee
    const { data: existingEntry, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw fetchError;
    }
    
    // Upload the document image to storage first
    const { documentImage, ...restDocumentData } = documentData;
    
    // Generate a unique file path
    const timestamp = new Date().getTime();
    const filePath = `${employeeId}/${documentData.documentType}_${timestamp}`;
    
    // Extract the base64 content and content type
    const base64Regex = /^data:([^;]+);base64,(.+)$/;
    const matches = documentImage.match(base64Regex);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image format");
    }
    
    const contentType = matches[1];
    const base64Content = matches[2];
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('employee-documents')
      .upload(filePath, binaryData, {
        contentType,
        upsert: true
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: publicUrlData } = await supabase
      .storage
      .from('employee-documents')
      .getPublicUrl(filePath);
    
    const documentUrl = publicUrlData.publicUrl;
    
    // Prepare document record
    const documentRecord = {
      ...restDocumentData,
      documentNumber: restDocumentData.documentNumber || '',
      documentImage: documentUrl,
      filePath: filePath,
      uploadedAt: new Date().toISOString(),
      id: crypto.randomUUID()
    };
    
    // Store document_type and document_no in the main row
    const documentType = documentData.documentType || null;
    const documentNo = documentData.documentNumber || null;
    
    // Create log entry for upload
    const logEntry = {
      action: 'upload',
      documentId: documentRecord.id,
      documentType,
      performedAt: new Date().toISOString(),
      details: {
        documentNumber: documentNo
      }
    };
    
    let dbResult;
    if (existingEntry) {
      // Employee already has documents - update the array
      const updatedDocuments = [...JSON.parse(JSON.stringify(existingEntry.documents || [])), documentRecord];
      const updatedLogs = [...JSON.parse(JSON.stringify(existingEntry.employee_docs_log || [])), logEntry];
      
      dbResult = await supabase
        .from('employee_documents')
        .update({ 
          documents: updatedDocuments,
          document_type: documentType, // Update the document_type column
          document_no: documentNo,     // Update the document_no column
          employee_docs_log: updatedLogs // Update the logs
        })
        .eq('employee_id', employeeId);
    } else {
      // Create a new record for this employee
      dbResult = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          documents: [documentRecord],
          document_type: documentType, // Set the document_type column
          document_no: documentNo,     // Set the document_no column
          employee_docs_log: [logEntry] // Initialize the logs
        });
    }
    
    if (dbResult.error) {
      // If database update fails, try to delete the uploaded file
      await supabase.storage.from('employee-documents').remove([filePath]);
      throw dbResult.error;
    }
    
    return new Response(
      JSON.stringify({ success: true, document: documentRecord }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleDocumentDelete(employeeId, documentId, supabase, corsHeaders) {
  if (!employeeId || !documentId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // Get the employee's documents
    const { data: existingEntry, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!existingEntry || !existingEntry.documents || !Array.isArray(existingEntry.documents)) {
      return new Response(
        JSON.stringify({ error: "No documents found for this employee" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find the document to delete
    const documentToDelete = existingEntry.documents.find(doc => doc.id === documentId);
    
    if (!documentToDelete) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create log entry for document deletion
    const logEntry = {
      action: 'delete',
      documentId: documentId,
      documentType: documentToDelete.documentType,
      performedAt: new Date().toISOString(),
      details: {
        documentNumber: documentToDelete.documentNumber,
        documentImage: documentToDelete.documentImage
      }
    };
    
    // Add the log entry to the existing logs
    const updatedLogs = [...JSON.parse(JSON.stringify(existingEntry.employee_docs_log || [])), logEntry];
    
    // Delete the file from storage if filePath exists
    if (documentToDelete.filePath) {
      const { error: storageError } = await supabase
        .storage
        .from('employee-documents')
        .remove([documentToDelete.filePath]);
      
      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue anyway, as we still want to remove the document record
      }
    }
    
    // Update the documents array, removing the deleted document
    const updatedDocuments = existingEntry.documents.filter(doc => doc.id !== documentId);
    
    // Update the database record with both document changes and the new log entry
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        documents: updatedDocuments,
        employee_docs_log: updatedLogs 
      })
      .eq('employee_id', employeeId);
    
    if (updateError) {
      throw updateError;
    }
    
    // If no documents remain, update the document_type and document_no to null
    if (updatedDocuments.length === 0) {
      await supabase
        .from('employee_documents')
        .update({ document_type: null, document_no: null })
        .eq('employee_id', employeeId);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleListDocuments(employeeId, supabase, corsHeaders) {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw error;
    }
    
    const documents = data?.documents || [];
    
    return new Response(
      JSON.stringify({ 
        documents,
        document_type: data?.document_type || null,
        document_no: data?.document_no || null,
        logs: data?.employee_docs_log || []
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error retrieving documents:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
