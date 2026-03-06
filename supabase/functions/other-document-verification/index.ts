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
  
  try {
    const requestBody = await req.json();
    const { 
      action,
      documentId, 
      verification_notes,
      // New fields for document processing
      employeeId,
      clientId,
      documentImage,
      params
    } = requestBody;
    
    console.log(`Other Document Verification: Received ${action} request`, { 
      documentId, 
      employeeId,
      clientId,
      hasVerificationNotes: !!verification_notes,
      hasDocumentImage: !!documentImage,
      params
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Handle Bank Statement Analysis processing
    if (action === 'processBankStatementAnalysis') {
      return await handleBankStatementAnalysis(
        requestBody, 
        supabase, 
        corsHeaders
      );
    }

    // Handle Court Case Check processing
    if (action === 'processCourtCaseCheck') {
      return await handleCourtCaseCheck(
        requestBody, 
        supabase, 
        corsHeaders
      );
    }

    // Handle Police Verification processing
    if (action === 'processPoliceVerification') {
      return await handlePoliceVerification(
        requestBody, 
        supabase, 
        corsHeaders
      );
    }

    // Handle Digital Credibility Check processing
    if (action === 'processDigitalCredibilityCheck') {
      return await handleDigitalCredibilityCheck(
        requestBody,
        supabase,
        corsHeaders
      );
    }

    // Handle Social Persona Check processing
    if (action === 'processSocialPersonaCheck') {
      return await handleSocialPersonaCheck(
        requestBody,
        supabase,
        corsHeaders
      );
    }

    // Handle Drug Check processing
    if (action === 'processDrugCheck') {
      return await handleDrugCheck(
        requestBody,
        supabase,
        corsHeaders
      );
    }
    
    // First, fetch document status IDs for manual and rejected statuses
    const { data: manualStatus, error: manualError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'manual')
      .single();
    
    if (manualError) {
      console.error("Error fetching manual status:", manualError);
      return new Response(
        JSON.stringify({ error: "Could not find manual status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: rejectedStatus, error: rejectedError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'rejected')
      .single();
    
    if (rejectedError) {
      console.error("Error fetching rejected status:", rejectedError);
      return new Response(
        JSON.stringify({ error: "Could not find rejected status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const manualStatusId = manualStatus?.id;
    const rejectedStatusId = rejectedStatus?.id;
    
    console.log("Status IDs found:", {
      manual: manualStatusId,
      rejected: rejectedStatusId
    });
    
    // Get the employee document first to work with
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Document ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: document, error: documentError } = await supabase
      .from('employee_documents')
      .select('employee_id')
      .eq('id', documentId)
      .eq('is_delete', 0)
      .single();
    
    if (documentError) {
      console.error("Error fetching document:", documentError);
      return new Response(
        JSON.stringify({ error: "Could not fetch document details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle manual verification
    if (action === 'manualVerify') {
      try {
        console.log("Processing manual verification for document ID:", documentId);
        
        // Create a log entry with timestamp
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "manual_verification",
          notes: verification_notes || "Document manually verified by staff"
        };
        
        // Update document with verification status and manual status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            employee_docs_log: [logEntry],
            document_status_id: manualStatusId,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document with manual verification:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document manually verified",
            status: "verified",
            statusId: manualStatusId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in manual verification:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process manual verification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle rejection
    else if (action === 'reject') {
      try {
        console.log("Processing rejection for document ID:", documentId);
        
        // Create log entry for rejection
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_document",
          notes: verification_notes || "Document verification rejected"
        };
        
        // Update document with rejected status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            employee_docs_log: [logEntry],
            document_status_id: rejectedStatusId,
            verified_by: null,
            api_verification_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document with rejection:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verification rejected",
            status: "failed",
            statusId: rejectedStatusId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in rejection:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process rejection" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action specified" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to handle Bank Statement Analysis
// Updated to match the new pattern: create document record first, files uploaded via queue
async function handleBankStatementAnalysis(requestBody, supabase, corsHeaders) {
  const { 
    employeeId,
    clientId,
    documentTypeId,
    params 
  } = requestBody;
  
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    console.log("Processing Bank Statement Analysis for employee:", employeeId, "client:", clientId);
    
    // Get the in-progress status ID
    const { data: inProgressStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    
    if (statusError) {
      console.error("Error getting in-progress status ID:", statusError);
      throw statusError;
    }
    
    console.log("Using in-progress status ID:", inProgressStatus?.id);
    
    // Add initial log entry for bank statement analysis
    const timestamp = new Date().getTime();
    const initialLogEntry = {
      timestamp: new Date().toISOString(),
      action: "bank_statement_analysis_initiated",
      response: {
        documentTypeId: documentTypeId,
        documentStatusId: inProgressStatus?.id
      }
    };
    
    // Generate a unique document number for bank statement analysis
    const documentNumber = `BSA_${timestamp}`;
    
    // Insert new document record (files will be uploaded via queue)
    const newDocumentRecord = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_number: documentNumber,
      document_url: '',
      verification_status: 'in-progress',
      document_status_id: inProgressStatus?.id,
      employee_docs_log: [initialLogEntry],
      params: params || { selected: 'bank_statement_analysis' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating bank statement analysis document record:", {
      employeeId: newDocumentRecord.employee_id,
      documentTypeId: newDocumentRecord.document_type_id,
      documentNumber: newDocumentRecord.document_number,
      verificationStatus: newDocumentRecord.verification_status,
      documentStatusId: newDocumentRecord.document_status_id,
      params: JSON.stringify(newDocumentRecord.params)
    });
    
    // Insert the document record
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert(newDocumentRecord)
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log("Bank statement analysis document created successfully");
    
    // Prepare response document object
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Bank statement analysis initiated and processing started",
        document: documentResponse
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing bank statement analysis:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process bank statement analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

/* OLD IMPLEMENTATION - Commented out, replaced with new queue-based approach
// Function to handle Bank Statement Analysis
async function handleBankStatementAnalysis_OLD(requestBody, supabase, corsHeaders) {
  const { 
    employeeId,
    clientId,
    documentImage,
    documentTypeId,
    params 
  } = requestBody;
  
  if (!employeeId || !clientId || !documentImage) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId, documentImage" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    console.log("Processing Bank Statement Analysis for employee:", employeeId, "client:", clientId);
    
    // Extract the base64 content and content type
    const base64Regex = /^data:([^;]+);base64,(.+)$/;
    const matches = documentImage.match(base64Regex);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image format"); 
    }
    
    const contentType = matches[1];
    const base64Content = matches[2];
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    // Generate file path with client_id/employee_id structure
    const timestamp = new Date().getTime();
    const filePath = `${clientId}/${employeeId}/bank_statement_${timestamp}.pdf`;
    
    console.log("Uploading bank statement to path:", filePath);
    
    // Upload to employee-documents bucket
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
    
    console.log("Bank statement uploaded successfully:", uploadData);
    
    // Get the in-progress status ID
    const { data: inProgressStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    
    if (statusError) {
      console.error("Error getting in-progress status ID:", statusError);
      throw statusError;
    }
    
    console.log("Using in-progress status ID:", inProgressStatus?.id);
    
    // Create storage URL for the uploaded file using employee-documents bucket
    const storageBase = Deno.env.get('PUBLIC_STORAGE_BASE_URL');
    const normalizedBase = storageBase.replace(/\/$/, '');
    const storageUrl = `${normalizedBase}/employee-documents/${filePath}`;
    
    // Add initial log entry for bank statement analysis
    const initialLogEntry = {
      timestamp: new Date().toISOString(),
      action: "bank_statement_analysis_uploaded",
      response: {
        documentTypeId: documentTypeId,
        documentStatusId: inProgressStatus?.id,
        storageUrl: storageUrl
      }
    };
    
    // Generate a unique document number for bank statement analysis
    const documentNumber = `BSA_${timestamp}`;
    
    // Insert new document record
    const newDocumentRecord = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_number: documentNumber,
      document_url: storageUrl,
      verification_status: 'in-progress',
      document_status_id: inProgressStatus?.id,
      employee_docs_log: [initialLogEntry],
      params: params || { selected: 'bank_statement_analysis' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating document record with storage URL:", {
      employeeId: newDocumentRecord.employee_id,
      documentTypeId: newDocumentRecord.document_type_id,
      documentNumber: newDocumentRecord.document_number,
      verificationStatus: newDocumentRecord.verification_status,
      storageUrl: newDocumentRecord.document_url,
      documentStatusId: newDocumentRecord.document_status_id,
      params: JSON.stringify(newDocumentRecord.params)
    });
    
    // Insert the document record
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert(newDocumentRecord)
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    
    if (insertError) {
      // If database insertion fails, try to delete the uploaded file
      await supabase.storage.from('employee-documents').remove([filePath]);
      throw insertError;
    }
    
    console.log("Bank statement analysis document created successfully");
    
    // Prepare response document object
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: storageUrl,
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Bank statement analysis uploaded and processing initiated",
        document: documentResponse
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing bank statement analysis:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process bank statement analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
*/

// Function to handle Court Case Check
async function handleCourtCaseCheck(requestBody, supabase, corsHeaders) {
  const { 
    employeeId,
    clientId,
    documentTypeId,
    params 
  } = requestBody;
  
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    console.log("Processing Court Case Check for employee:", employeeId, "client:", clientId);
    
    // Get the in-progress status ID
    const { data: inProgressStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    
    if (statusError) {
      console.error("Error getting in-progress status ID:", statusError);
      throw statusError;
    }
    
    console.log("Using in-progress status ID:", inProgressStatus?.id);
    
    // Add initial log entry for court case check
    const initialLogEntry = {
      timestamp: new Date().toISOString(),
      action: "court_case_check_initiated",
      response: {
        documentTypeId: documentTypeId,
        documentStatusId: inProgressStatus?.id
      }
    };
    
    // Generate a unique document number for court case check
    const timestamp = new Date().getTime();
    const documentNumber = `CCC_${timestamp}`;
    
    // Insert new document record
    const newDocumentRecord = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_number: documentNumber,
      document_url: '',
      verification_status: 'in-progress',
      document_status_id: inProgressStatus?.id,
      employee_docs_log: [initialLogEntry],
      params: params || { selected: 'court_case_check' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating court case check document record:", {
      employeeId: newDocumentRecord.employee_id,
      documentTypeId: newDocumentRecord.document_type_id,
      documentNumber: newDocumentRecord.document_number,
      verificationStatus: newDocumentRecord.verification_status,
      documentStatusId: newDocumentRecord.document_status_id,
      params: JSON.stringify(newDocumentRecord.params)
    });
    
    // Insert the document record
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert(newDocumentRecord)
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log("Court case check document created successfully");
    
    // Prepare response document object
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Court case check initiated and processing started",
        document: documentResponse
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing court case check:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process court case check" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Function to handle Police Verification
async function handlePoliceVerification(requestBody, supabase, corsHeaders) {
  const { 
    employeeId,
    clientId,
    documentTypeId,
    params 
  } = requestBody;
  
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    console.log("Processing Police Verification for employee:", employeeId, "client:", clientId);
    
    // Get the in-progress status ID
    const { data: inProgressStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    
    if (statusError) {
      console.error("Error getting in-progress status ID:", statusError);
      throw statusError;
    }
    
    console.log("Using in-progress status ID:", inProgressStatus?.id);
    
    // Add initial log entry for police verification
    const initialLogEntry = {
      timestamp: new Date().toISOString(),
      action: "police_verification_initiated",
      response: {
        documentTypeId: documentTypeId,
        documentStatusId: inProgressStatus?.id
      }
    };
    
    // Generate a unique document number for police verification
    const timestamp = new Date().getTime();
    const documentNumber = `PV_${timestamp}`;
    
    // Insert new document record
    const newDocumentRecord = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_number: documentNumber,
      document_url: '',
      verification_status: 'in-progress',
      document_status_id: inProgressStatus?.id,
      employee_docs_log: [initialLogEntry],
      params: params || { selected: 'police_verification' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating police verification document record:", {
      employeeId: newDocumentRecord.employee_id,
      documentTypeId: newDocumentRecord.document_type_id,
      documentNumber: newDocumentRecord.document_number,
      verificationStatus: newDocumentRecord.verification_status,
      documentStatusId: newDocumentRecord.document_status_id,
      params: JSON.stringify(newDocumentRecord.params)
    });
    
    // Insert the document record
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert(newDocumentRecord)
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log("Police verification document created successfully");
    
    // Prepare response document object
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Police verification initiated and processing started",
        document: documentResponse
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing police verification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process police verification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Function to handle Digital Credibility Check
async function handleDigitalCredibilityCheck(requestBody, supabase, corsHeaders) {
  const { employeeId, clientId, documentTypeId, params } = requestBody;
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  try {
    const { data: inProgressStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    const timestamp = new Date().getTime();
    const documentNumber = `DCC_${timestamp}`;
    const initialLogEntry = { timestamp: new Date().toISOString(), action: 'digital_credibility_check_initiated', response: { documentTypeId, documentStatusId: inProgressStatus?.id } };
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type_id: documentTypeId,
        document_number: documentNumber,
        document_url: '',
        verification_status: 'in-progress',
        document_status_id: inProgressStatus?.id,
        employee_docs_log: [initialLogEntry],
        params: params || { selected: 'digital_credibility_check' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    if (insertError) throw insertError;
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    return new Response(
      JSON.stringify({ success: true, message: 'Digital credibility check initiated and processing started', document: documentResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process digital credibility check' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to handle Social Persona Check
async function handleSocialPersonaCheck(requestBody, supabase, corsHeaders) {
  const { employeeId, clientId, documentTypeId, params } = requestBody;
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  try {
    const { data: inProgressStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    const timestamp = new Date().getTime();
    const documentNumber = `SPC_${timestamp}`;
    const initialLogEntry = { timestamp: new Date().toISOString(), action: 'social_personal_check_initiated', response: { documentTypeId, documentStatusId: inProgressStatus?.id } };
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type_id: documentTypeId,
        document_number: documentNumber,
        document_url: '',
        verification_status: 'in-progress',
        document_status_id: inProgressStatus?.id,
        employee_docs_log: [initialLogEntry],
        params: params || { selected: 'social_personal_check' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    if (insertError) throw insertError;
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    return new Response(
      JSON.stringify({ success: true, message: 'Social personal check initiated and processing started', document: documentResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process social personal check' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to handle Drug Check
async function handleDrugCheck(requestBody, supabase, corsHeaders) {
  const { employeeId, clientId, documentTypeId, params } = requestBody;
  if (!employeeId || !clientId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: employeeId, clientId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  try {
    const { data: inProgressStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();
    const timestamp = new Date().getTime();
    const documentNumber = `DC_${timestamp}`;
    const initialLogEntry = { timestamp: new Date().toISOString(), action: 'drug_check_initiated', response: { documentTypeId, documentStatusId: inProgressStatus?.id } };
    const { data: insertData, error: insertError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type_id: documentTypeId,
        document_number: documentNumber,
        document_url: '',
        verification_status: 'in-progress',
        document_status_id: inProgressStatus?.id,
        employee_docs_log: [initialLogEntry],
        params: params || { selected: 'drug_check' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, document_status:document_status_id(*), document_type:document_type_id(*)')
      .single();
    if (insertError) throw insertError;
    const documentResponse = {
      id: insertData.id,
      employeeId: insertData.employee_id,
      documentTypeId: insertData.document_type_id,
      documentTypeName: insertData.document_type?.name || '',
      documentNumber: insertData.document_number,
      documentImage: '',
      verificationStatus: insertData.verification_status,
      documentStatusId: insertData.document_status_id,
      documentStatusName: insertData.document_status?.name || '',
      employee_docs_log: insertData.employee_docs_log || [],
      params: insertData.params || {},
      createdAt: insertData.created_at,
      updatedAt: insertData.updated_at
    };
    return new Response(
      JSON.stringify({ success: true, message: 'Drug check initiated and processing started', document: documentResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process drug check' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
