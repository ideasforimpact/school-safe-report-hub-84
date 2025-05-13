import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { v4 as uuidv4 } from "https://esm.sh/uuid@10.0.0";

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
    // Prepare update object with only fields that exist in the table
    const updateObject = {};
    
    if (verificationStatus) {
      updateObject.verification_status = verificationStatus;
    }
    
    if (documentStatusId) {
      updateObject.document_status_id = documentStatusId;
    }
    
    // Add other fields that exist in the table
    updateObject.updated_at = new Date().toISOString();
    
    if (verificationNotes) {
      // Since we don't have a verification_notes column directly, 
      // we might store this in another way or skip it
      // For now, we'll skip it since it's not in the schema
    }
    
    // Update individual document record
    const { data: updateData, error: updateError } = await supabase
      .from('employee_documents')
      .update(updateObject)
      .eq('id', documentId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Check all employee documents to update overall status
    const { data: employeeDocs, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId);
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Determine overall employee verification status
    let overallStatus = 'pending';
    const allVerified = employeeDocs.every(doc => doc.verification_status === 'verified');
    const anyFailed = employeeDocs.some(doc => doc.verification_status === 'failed');
    
    if (anyFailed) {
      overallStatus = 'failed';
    } else if (allVerified) {
      overallStatus = 'verified';
    }
    
    // Update employee status
    await supabase
      .from('employees')
      .update({ status: overallStatus })
      .eq('id', employeeId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        status: verificationStatus,
        document: updateData
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
    console.log("Handling document upload for employee:", employeeId);
    
    // Upload the document image to storage first
    const { documentImage, documentNumber, documentStatusId, ...restDocumentData } = documentData;
    
    // Generate a unique file path
    const timestamp = new Date().getTime();
    const filePath = `${employeeId}/${restDocumentData.documentTypeId}_${timestamp}`;
    
    console.log("Generated file path:", filePath);
    
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
    console.log("Uploading file to storage...");
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('employee-documents')
      .upload(filePath, binaryData, {
        contentType,
        upsert: true
      });
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }
    
    console.log("File uploaded successfully:", uploadData);
    
    // Get pending document status ID if none is provided
    let pendingStatusId = documentStatusId;
    if (!pendingStatusId) {
      const { data: statusData, error: statusError } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', 'pending')
        .maybeSingle();
      
      if (statusError) {
        console.error("Error getting pending status ID:", statusError);
      } else {
        pendingStatusId = statusData?.id;
      }
    }
    
    console.log("Using document status ID:", pendingStatusId);
    
    // Store document number directly in plaintext without encryption
    const plainTextDocNumber = documentNumber;
    
    // Insert new document record with only the columns that exist in the table
    const newDocumentRecord = {
      employee_id: employeeId,
      document_type_id: restDocumentData.documentTypeId,
      document_number: plainTextDocNumber, // Store as plaintext
      document_url: filePath,
      verification_status: 'pending',
      document_status_id: pendingStatusId, // Added document_status_id pointing to pending status
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating document record:", {
      employeeId: newDocumentRecord.employee_id,
      documentTypeId: newDocumentRecord.document_type_id,
      filePath: newDocumentRecord.document_url,
      hasDocNumber: !!plainTextDocNumber,
      documentStatusId: newDocumentRecord.document_status_id
    });
    
    // Insert the document record
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert(newDocumentRecord)
      .select()
      .single();
    
    if (insertError) {
      // If database insertion fails, try to delete the uploaded file
      await supabase.storage.from('employee-documents').remove([filePath]);
      throw insertError;
    }
    
    console.log("Document uploaded and saved successfully");
    
    // Get the document type name
    const { data: docTypeData } = await supabase
      .from('employee_document_type')
      .select('name')
      .eq('id', restDocumentData.documentTypeId)
      .single();
    
    // Get document status name if available
    let documentStatusName = '';
    if (pendingStatusId) {
      const { data: statusNameData } = await supabase
        .from('document_status')
        .select('name')
        .eq('id', pendingStatusId)
        .single();
      
      documentStatusName = statusNameData?.name || '';
    }
    
    // For UI display, prepare a masked version of the document number
    let displayDocNumber = '';
    if (documentNumber && documentNumber.length > 2) {
      displayDocNumber = documentNumber.slice(0, -2).replace(/./g, 'X') + documentNumber.slice(-2);
    } else {
      displayDocNumber = documentNumber || '';
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        document: {
          id: insertData.id,
          documentTypeId: insertData.document_type_id,
          documentTypeName: docTypeData?.name || '',
          documentNumber: displayDocNumber,  // Return the masked version for UI
          documentImage: `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${filePath}`,
          verificationStatus: insertData.verification_status,
          documentStatusId: insertData.document_status_id,
          documentStatusName: documentStatusName
        }
      }),
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

// Update the function that handles listing documents to not apply masking
async function handleListDocuments(employeeId, supabase, corsHeaders) {
  try {
    // First fetch the documents
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .eq('employee_id', employeeId);
    
    if (error) {
      throw error;
    }
    
    // Process documents without masking document numbers
    const processedDocuments = data.map(doc => {
      // Process each document to match the expected structure
      return {
        id: doc.id,
        employeeId: doc.employee_id,
        documentTypeId: doc.document_type_id,
        documentTypeName: doc.document_type?.name || '',
        documentNumber: doc.document_number || '',
        documentImage: doc.document_url ? `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${doc.document_url}` : '',
        verificationStatus: doc.verification_status,
        documentStatusId: doc.document_status_id,
        documentStatusName: doc.document_status?.name || '',
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      };
    });
    
    return new Response(
      JSON.stringify({ documents: processedDocuments }),
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

async function handleDocumentDelete(employeeId, documentId, supabase, corsHeaders) {
  if (!employeeId || !documentId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // Get the document details first
    const { data: documentToDelete, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .eq('employee_id', employeeId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!documentToDelete) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Delete the file from storage if document_url exists
    if (documentToDelete.document_url) {
      const { error: storageError } = await supabase
        .storage
        .from('employee-documents')
        .remove([documentToDelete.document_url]);
      
      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue anyway, as we still want to remove the document record
      }
    }
    
    // Delete the document record
    const { error: deleteError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    // Update employee verification status based on remaining documents
    await updateEmployeeVerificationStatus(employeeId, supabase);
    
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

// Add a helper function to update employee verification status
async function updateEmployeeVerificationStatus(employeeId, supabase) {
  try {
    // Check remaining documents for verification status
    const { data: remainingDocs } = await supabase
      .from('employee_documents')
      .select('verification_status')
      .eq('employee_id', employeeId);
    
    // Determine overall employee verification status
    let newStatus = 'pending';
    
    if (remainingDocs && remainingDocs.length > 0) {
      const allVerified = remainingDocs.every(doc => doc.verification_status === 'verified');
      const anyFailed = remainingDocs.some(doc => doc.verification_status === 'failed');
      
      if (anyFailed) {
        newStatus = 'failed';
      } else if (allVerified) {
        newStatus = 'verified';
      }
    }
    
    // Update employee status
    await supabase
      .from('employees')
      .update({ status: newStatus })
      .eq('id', employeeId);
      
    return newStatus;
  } catch (error) {
    console.error("Error updating employee verification status:", error);
    throw error;
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
    const txnId = uuidv4();
    
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
    
    // Get the document to verify
    const { data: docData, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError) {
      throw docError;
    }
    
    if (!docData) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update the document verification status
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({
        verification_status: 'verified',
        last_otp_generated: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Check if all employee documents are now verified
    const { data: employeeDocs } = await supabase
      .from('employee_documents')
      .select('verification_status')
      .eq('employee_id', docData.employee_id);
    
    const allVerified = employeeDocs.every(doc => doc.verification_status === 'verified');
    
    // Update employee status if all docs are verified
    if (allVerified) {
      await supabase
        .from('employees')
        .update({ status: 'verified' })
        .eq('id', docData.employee_id);
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
