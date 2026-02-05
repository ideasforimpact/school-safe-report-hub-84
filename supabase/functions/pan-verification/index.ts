import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { logVerificationError, logVerificationSuccess } from "../_shared/verificationAuditlog.ts";

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
      documentNumber,
      verification_notes,
      verified_by_employee_id,
      reject_reason
    } = requestBody;
    
    console.log(`PAN Verification: Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber,
      notes: verification_notes,
      verified_by_employee_id: verified_by_employee_id
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Default base URL and API key
    let baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL");
    
    let apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") 
    
    // First, fetch document status IDs for governance, manual and rejected statuses
    const { data: governanceStatus, error: governanceError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .single();
    
    if (governanceError) {
      console.error("Error fetching governance status:", governanceError);
      return new Response(
        JSON.stringify({ error: "Could not find governance status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
    
    const governanceStatusId = governanceStatus?.id;
    const manualStatusId = manualStatus?.id;
    const rejectedStatusId = rejectedStatus?.id;
    
    console.log("Status IDs found:", {
      governance: governanceStatusId,
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
      .select('employee_docs_log, employee_id, document_type_id')
      .eq('id', documentId)
      .single();
    
    if (documentError) {
      console.error("Error fetching document:", documentError);
      return new Response(
        JSON.stringify({ error: "Could not fetch document details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get existing logs or initialize empty array
    const existingLogs = document?.employee_docs_log || [];
    const employeeId = document.employee_id;
    const documentTypeId = document?.document_type_id;
    // Handle API verification using Surepass - NEW BEHAVIOR
    if (action === 'apiVerify') {
      if (!documentNumber) {
        return new Response(
          JSON.stringify({ error: "Document number is required for API verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        console.log("Making request to Surepass API to verify PAN with base URL:", baseUrl);
        
        // Changed API endpoint from pan-comprehensive-v2 to pan-comprehensive
        const response = await fetch(`${baseUrl}/api/v1/pan/pan-comprehensive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: documentNumber })
        });
        
        const data = await response.json();
        console.log("Surepass API response:", JSON.stringify(data));
        
        // Create an API log entry with timestamp
        const apiLogEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_pan_api",
          response: data
        };
        
        // NEW BEHAVIOR: Always store API response and keep status as pending
        // Only set to failed if API call completely failed
        if (data.success && data.status_code === 200) {
          // Extract personal_info from API response data
          const apiData = data?.data || {};
          let personalInfo: { dob?: string; address?: string } | null = null;
          
          // Extract dob and address if available
          if (apiData.dob || apiData.address) {
            personalInfo = {};
            
            // Format and store dob in YYYY-MM-DD format
            if (apiData.dob) {
              const dobStr = String(apiData.dob).trim();
              
              // Check if already in YYYY-MM-DD format (most common case)
              if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
                personalInfo.dob = dobStr;
              } else {
                // Try to parse and format the date if in different format
                const dobDate = new Date(dobStr);
                if (!isNaN(dobDate.getTime())) {
                  const year = dobDate.getFullYear();
                  const month = String(dobDate.getMonth() + 1).padStart(2, '0');
                  const day = String(dobDate.getDate()).padStart(2, '0');
                  personalInfo.dob = `${year}-${month}-${day}`;
                } else {
                  // If parsing fails, log warning but don't store invalid date
                  console.warn('Invalid date format for dob:', dobStr);
                }
              }
            }
            await logVerificationSuccess(supabase, {
              employeeId,
              documentId,
              provider: 'surepass',
              statusCode: data.status_code,
              response: data,
              documentTypeId: documentTypeId ?? undefined,
              documentTypeName: 'PAN',
              documentNumber: documentNumber
            });

            // Always set address field - concatenate if available, otherwise empty string
            if (apiData.address && typeof apiData.address === 'object') {
              const addr = apiData.address;
              const addressParts: string[] = [];
              
              // Build address in logical order: line_1, line_2, street_name, city, state, zip, country
              // Use full address if available, otherwise build from parts
              if (addr.full && addr.full.trim()) {
                // If full address is provided, use it
                addressParts.push(addr.full);
              } else {
                // Otherwise, build from individual fields
                if (addr.line_1 && addr.line_1.trim()) addressParts.push(addr.line_1);
                if (addr.line_2 && addr.line_2.trim()) addressParts.push(addr.line_2);
                if (addr.street_name && addr.street_name.trim()) addressParts.push(addr.street_name);
                if (addr.city && addr.city.trim()) addressParts.push(addr.city);
                if (addr.state && addr.state.trim()) addressParts.push(addr.state);
                if (addr.zip && addr.zip.trim()) addressParts.push(addr.zip);
                if (addr.country && addr.country.trim()) addressParts.push(addr.country);
              }
              
              // Join with comma and space, or store empty string if all fields are empty
              personalInfo.address = addressParts.length > 0 
                ? addressParts.filter(part => part && part.trim()).join(', ')
                : '';
            } else {
              // If address is not an object or doesn't exist, store empty string
              personalInfo.address = '';
            }
          }
          
          // API Success: Store response in api_response_data, keep status pending
          const updateData: any = {
            api_response_data: data,
            api_verification_status: 'completed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString(),
            employee_docs_log: [...existingLogs, apiLogEntry],
            updated_at: new Date().toISOString()
            // verification_status stays 'pending' - user needs to manually review
          };
          
          // Add personal_info if we extracted it
          if (personalInfo) {
            updateData.personal_info = personalInfo;
          }
          
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update(updateData)
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with API response:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "PAN API verification completed. Please review the response.",
              requiresReview: true,
              ...data // Include the complete API response data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // API Failure: Store response but keep status as pending for manual review
          // Don't automatically set to failed - let admin review first
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_pan_api_failed",
            response: data
          };
          
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "PAN verification failed";
          let errorCode = "PAN_VERIFICATION_FAILED";
          
          if (data.message) {
            const message = data.message.toLowerCase();
            if (message.includes('invalid pan') || message.includes('pan not found')) {
              userFriendlyError = "This PAN number is not found in government records";
              errorCode = "PAN_INVALID";
            } else if (message.includes('format') || message.includes('pattern')) {
              userFriendlyError = "Please enter a valid PAN number (e.g., ABCDE1234F)";
              errorCode = "PAN_INVALID_FORMAT";
            } else if (message.includes('already linked')) {
              userFriendlyError = "This PAN is already linked to another Aadhaar";
              errorCode = "PAN_ALREADY_LINKED";
            } else {
              userFriendlyError = "PAN verification failed. Please check the number and try again.";
            }
          }
          
          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: data.status_code,
            message: data.message,
            response: data,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'PAN',
            documentNumber: documentNumber
          });
          // Return response indicating API failed but status remains pending for review
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: data.message,
              message: userFriendlyError,
              requiresReview: true,
              apiResponse: data // Include API response for review
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error verifying PAN with Surepass API:", error);
        
        // API call failed completely - store error but keep status pending for review
        await supabase
          .from('employee_documents')
          .update({
            api_verification_status: 'failed',
            api_verification_method: 'api',
            employee_docs_log: [...existingLogs, {
              timestamp: new Date().toISOString(),
              action: "verify_pan_api_error",
              response: { error: error.message }
            }],
            // verification_status stays 'pending' - admin needs to manually review
            // document_status_id stays unchanged
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        let userFriendlyError = "Something went wrong during PAN verification. Please try again.";
        let errorCode = "INTERNAL_ERROR";
        
        if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          userFriendlyError = "Verification service is temporarily unavailable. Please try again.";
          errorCode = "CONNECTION_TIMEOUT";
        } else if (error.message?.includes('429') || error.message?.includes('limit')) {
          userFriendlyError = "Too many verification attempts. Please try again after some time.";
          errorCode = "API_LIMIT_EXCEEDED";
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: userFriendlyError,
            errorCode: errorCode,
            originalError: error.message
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle manual verification
    else if (action === 'manualVerify') {
      try {
        console.log(`Manual verification - verified_by_employee_id: ${verified_by_employee_id}`);
        
        if (!verified_by_employee_id) {
          console.error("Missing verified_by_employee_id for manual verification");
          return new Response(
            JSON.stringify({ error: "Employee ID is required for manual verification" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry for manual verification
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_pan_manual",
          notes: verification_notes || "Manually verified by staff",
          verified_by: verified_by_employee_id
        };
        
        // Update document with verification status and manual status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: manualStatusId,
            verified_by: verified_by_employee_id,
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
            message: "PAN manually verified",
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
    // Approve after viewing API details - set governance status
    else if (action === 'approveAfterApi') {
      try {
        if (!verified_by_employee_id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for approval" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "approve_after_api",
          notes: verification_notes || "Approved after PAN API check",
          verified_by: verified_by_employee_id
        };
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: governanceStatusId,
            verified_by: verified_by_employee_id,
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to approve document" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Approval failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    
    // Handle rejection
    else if (action === 'reject') {
      try {
        console.log(`Rejection - verified_by_employee_id: ${verified_by_employee_id}`);
        
        if (!verified_by_employee_id) {
          console.error("Missing verified_by_employee_id for rejection");
          return new Response(
            JSON.stringify({ error: "Employee ID is required for rejection" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry for rejection
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_pan",
          notes: verification_notes || "Document verification rejected",
          verified_by: verified_by_employee_id
        };
        
        // Update document with rejected status and reject reason
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: rejectedStatusId,
            verified_by: null,
            reject_reason: reject_reason || "Document verification rejected",
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
            message: "PAN verification rejected",
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
