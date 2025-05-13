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
      const { employeeId, documentData, action } = body;
      
      // Handle Aadhar OTP operations
      if (action === 'requestAadharOtp') {
        return await handleAadharOtpRequest(body, corsHeaders);
      } else if (action === 'verifyAadharOtp') {
        return await handleAadharOtpVerify(body, supabase, corsHeaders);
      } else if (action === 'getDocumentTypes') {
        return await handleGetDocumentTypes(supabase, corsHeaders);
      } else if (action === 'getDocumentStatuses') {
        return await handleGetDocumentStatuses(supabase, corsHeaders);
      }
      
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

    // PUT method for updating document verification status
    if (req.method === "PUT") {
      const body = await req.json();
      const { employeeId, documentId, verificationStatus, verificationNotes, documentStatusId } = body;
      
      if (documentId && (verificationStatus || documentStatusId)) {
        return await handleUpdateVerificationStatus(
          employeeId, 
          documentId, 
          verificationStatus, 
          verificationNotes,
          documentStatusId,
          supabase, 
          corsHeaders
        );
      }
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

// New function to handle getting document types
async function handleGetDocumentTypes(supabase, corsHeaders) {
  try {
    const { data, error } = await supabase
      .from('employee_document_type')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ documentTypes: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error retrieving document types:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// New function to handle getting document statuses
async function handleGetDocumentStatuses(supabase, corsHeaders) {
  try {
    const { data, error } = await supabase
      .from('document_status')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ documentStatuses: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error retrieving document statuses:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Update the verification status function
async function handleUpdateVerificationStatus(
  employeeId, 
  documentId, 
  verificationStatus, 
  verificationNotes,
  documentStatusId,
  supabase, 
  corsHeaders
) {
  if (!employeeId || !documentId || (!verificationStatus && !documentStatusId)) {
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
    
    // Find the document to update
    const documentToUpdate = existingEntry.documents.find(doc => doc.id === documentId);
    
    if (!documentToUpdate) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get document status name if documentStatusId is provided
    let documentStatusName = null;
    if (documentStatusId) {
      const { data: statusData } = await supabase
        .from('document_status')
        .select('name')
        .eq('id', documentStatusId)
        .single();
      
      if (statusData) {
        documentStatusName = statusData.name;
      }
    }
    
    // Create log entry for status update
    const logEntry = {
      action: 'verify',
      documentId: documentId,
      documentTypeId: documentToUpdate.documentTypeId,
      performedAt: new Date().toISOString(),
      verificationStatus: verificationStatus || documentToUpdate.verificationStatus,
      documentStatusId: documentStatusId || documentToUpdate.documentStatusId,
      details: {
        documentNumber: documentToUpdate.documentNumber,
        notes: verificationNotes || "Status updated"
      }
    };
    
    // Add the log entry to the existing logs
    const updatedLogs = [...JSON.parse(JSON.stringify(existingEntry.employee_docs_log || [])), logEntry];
    
    // Update the document in the array
    const updatedDocuments = existingEntry.documents.map(doc => {
      if (doc.id === documentId) {
        return {
          ...doc,
          verificationStatus: verificationStatus || doc.verificationStatus,
          documentStatusId: documentStatusId || doc.documentStatusId,
          documentStatusName: documentStatusName || doc.documentStatusName,
          verificationDate: new Date().toISOString(),
          verificationNotes: verificationNotes || doc.verificationNotes
        };
      }
      return doc;
    });
    
    // Update the database record
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        documents: updatedDocuments,
        employee_docs_log: updatedLogs,
        verification_status: verificationStatus || existingEntry.verification_status, // Update the main verification_status column
        document_status_id: documentStatusId || existingEntry.document_status_id
      })
      .eq('employee_id', employeeId);
    
    if (updateError) {
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        status: verificationStatus || existingEntry.verification_status,
        document: updatedDocuments.find(doc => doc.id === documentId)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating document verification status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

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
    const filePath = `${employeeId}/${restDocumentData.documentTypeId}_${timestamp}`;
    
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
    
    // Get document type name
    const { data: documentTypeData } = await supabase
      .from('employee_document_type')
      .select('name')
      .eq('id', restDocumentData.documentTypeId)
      .single();
    
    // Get document status ID for pending
    const { data: pendingStatusData } = await supabase
      .from('document_status')
      .select('id, name')
      .eq('name', 'pending')
      .single();
    
    // Prepare document record
    const documentRecord = {
      ...restDocumentData,
      documentNumber: restDocumentData.documentNumber || '',
      documentTypeName: documentTypeData?.name || 'unknown',
      documentImage: documentUrl,
      documentStatusId: pendingStatusData?.id,
      documentStatusName: pendingStatusData?.name || 'pending',
      filePath: filePath,
      uploadedAt: new Date().toISOString(),
      verificationStatus: documentData.verificationStatus || 'pending',
      id: crypto.randomUUID()
    };
    
    // Create log entry for upload
    const logEntry = {
      action: 'upload',
      documentId: documentRecord.id,
      documentTypeId: restDocumentData.documentTypeId,
      performedAt: new Date().toISOString(),
      details: {
        documentNumber: restDocumentData.documentNumber || ''
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
          document_type_id: restDocumentData.documentTypeId,
          document_status_id: pendingStatusData?.id,
          employee_docs_log: updatedLogs,
          verification_status: documentData.verificationStatus || existingEntry.verification_status || 'pending'
        })
        .eq('employee_id', employeeId);
    } else {
      // Create a new record for this employee
      dbResult = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          documents: [documentRecord],
          document_type_id: restDocumentData.documentTypeId,
          document_status_id: pendingStatusData?.id,
          employee_docs_log: [logEntry],
          verification_status: documentData.verificationStatus || 'pending'
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
      documentTypeId: documentToDelete.documentTypeId,
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
    
    // If no documents remain, update the document_type_id and document_status_id to null
    if (updatedDocuments.length === 0) {
      await supabase
        .from('employee_documents')
        .update({ 
          document_type_id: null, 
          document_status_id: null,
          verification_status: null 
        })
        .eq('employee_id', employeeId);
    } else {
      // Check remaining documents for verification status
      const allVerified = updatedDocuments.every(doc => doc.verificationStatus === 'verified');
      const anyFailed = updatedDocuments.some(doc => doc.verificationStatus === 'failed');
      
      let newStatus = existingEntry.verification_status;
      if (anyFailed) {
        newStatus = 'failed';
      } else if (allVerified) {
        newStatus = 'verified';
      } else {
        newStatus = 'pending';
      }
      
      await supabase
        .from('employee_documents')
        .update({ verification_status: newStatus })
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
      .select('*, document_status:document_status_id(name), document_type:document_type_id(name)')
      .eq('employee_id', employeeId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw error;
    }
    
    // Process document records to include type and status names
    const documents = data?.documents || [];
    if (documents.length > 0 && data) {
      documents.forEach(doc => {
        if (data.document_status) {
          doc.documentStatusName = data.document_status.name;
        }
        if (data.document_type) {
          doc.documentTypeName = data.document_type.name;
        }
      });
    }
    
    return new Response(
      JSON.stringify({ 
        documents,
        document_type_id: data?.document_type_id || null,
        document_status_id: data?.document_status_id || null,
        logs: data?.employee_docs_log || [],
        verification_status: data?.verification_status || null
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

// New function to handle Aadhar OTP requests
async function handleAadharOtpRequest(body, corsHeaders) {
  const { documentNumber } = body;
  
  if (!documentNumber) {
    return new Response(
      JSON.stringify({ error: "Aadhar number is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // In a real implementation, this would call the Aadhar API
    // For this demo, we'll simulate a successful OTP request
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock transaction ID
    const txnId = crypto.randomUUID();
    
    // In a production environment, you would call the actual Aadhar API:
    // const surepassApiKey = Deno.env.get("SUREPASS_API_KEY");
    // const surepassUrl = Deno.env.get("SUREPASS_BASE_URL");
    
    // const response = await fetch(`${surepassUrl}/api/v1/aadhaar-v2/generate-otp`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${surepassApiKey}`
    //   },
    //   body: JSON.stringify({ aadhaar_number: documentNumber })
    // });
    // const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully to registered mobile number",
        txnId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to request OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// New function to handle Aadhar OTP verification
async function handleAadharOtpVerify(body, supabase, corsHeaders) {
  const { otp, txnId, documentId } = body;
  
  if (!otp || !txnId || !documentId) {
    return new Response(
      JSON.stringify({ error: "OTP, transaction ID, and document ID are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // In a real implementation, this would verify the OTP with Aadhar API
    // For this demo, we'll simulate OTP verification and update the document status
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a production environment, you would call the actual Aadhar API:
    // const surepassApiKey = Deno.env.get("SUREPASS_API_KEY");
    // const surepassUrl = Deno.env.get("SUREPASS_BASE_URL");
    
    // const response = await fetch(`${surepassUrl}/api/v1/aadhaar-v2/submit-otp`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${surepassApiKey}`
    //   },
    //   body: JSON.stringify({ 
    //     otp,
    //     txn_id: txnId
    //   })
    // });
    // const verifyData = await response.json();
    
    // For demonstration, accept any 6-digit OTP where the digits add up to a multiple of 5
    const otpSum = otp.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const isValidOtp = otpSum % 5 === 0;
    
    if (!isValidOtp) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid OTP. Please try again." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find which employee has this document
    let employeeId = null;
    
    // Get all employee documents
    const { data: employeeDocs, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*');
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Find the employee who owns this document
    for (const empDoc of employeeDocs) {
      if (empDoc.documents && Array.isArray(empDoc.documents)) {
        const documentExists = empDoc.documents.some(doc => doc.id === documentId);
        if (documentExists) {
          employeeId = empDoc.employee_id;
          break;
        }
      }
    }
    
    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Now update the document status
    const { data: existingEntry, error: fetchDocError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (fetchDocError) {
      throw fetchDocError;
    }
    
    if (!existingEntry.documents || !Array.isArray(existingEntry.documents)) {
      return new Response(
        JSON.stringify({ error: "No documents found for this employee" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create log entry for verification
    const logEntry = {
      action: 'verify',
      documentId: documentId,
      documentType: 'aadhar',
      performedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      details: {
        method: 'aadhar_api',
        txnId: txnId,
        verificationNotes: 'Document verified via Aadhar OTP'
      }
    };
    
    // Update the document in the array
    const updatedDocuments = existingEntry.documents.map(doc => {
      if (doc.id === documentId) {
        return {
          ...doc,
          verificationStatus: 'verified',
          verificationDate: new Date().toISOString(),
          verificationNotes: 'Document verified via Aadhar OTP verification',
          verificationMethod: 'api',
          details: {
            ...doc.details,
            aadhar_api_verification: true,
            verified_at: new Date().toISOString(),
            txn_id: txnId
          }
        };
      }
      return doc;
    });
    
    // Add the log entry to the existing logs
    const updatedLogs = [...JSON.parse(JSON.stringify(existingEntry.employee_docs_log || [])), logEntry];
    
    // Update the database record
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        documents: updatedDocuments,
        employee_docs_log: updatedLogs,
        verification_status: 'verified' // Update the main verification_status column
      })
      .eq('employee_id', employeeId);
    
    if (updateError) {
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Aadhar verification completed successfully",
        documentId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
