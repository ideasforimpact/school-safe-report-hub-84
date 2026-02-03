// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { logVerificationError, logVerificationSuccess } from "../_shared/verificationAuditlog.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const body = await req.json();
    const { action, documentId, verification_notes, verified_by_employee_id, reject_reason } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const environment = Deno.env.get("ENVIRONMENT") || "development";
    const baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || "https://kyc-api.surepass.io";
    const apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY");
    
    // Validate required environment variables
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Verification service configuration error. Please contact administrator.",
          errorCode: "CONFIG_ERROR"
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Authentication configuration error. Please contact administrator.",
          errorCode: "AUTH_CONFIG_ERROR"
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Status ids
    const fetchStatusId = async (name: string) => {
      const { data, error } = await supabase.from('document_status').select('id').eq('name', name).single();
      if (error) throw error;
      return data?.id as string;
    };

    const governanceStatusId = await fetchStatusId('governance');
    const rejectedStatusId = await fetchStatusId('rejected');
    const manualStatusId = await fetchStatusId('manual');

    if (action === 'apiVerify') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_number, params, employee_docs_log')
        .eq('id', documentId)
        .single();
      if (docError || !document) {
        return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const fileNumber = document.document_number; // passport file number
      const dob = document.params?.DOB;
      const existingLogs = document.employee_docs_log || [];
      const { data: doc } = await supabase
                .from('employee_documents')
                .select('employee_id')
                .eq('id', documentId)
                .single();

      const employeeId = doc?.employee_id;
      if (!fileNumber || !dob) {
        return new Response(JSON.stringify({ error: 'File number and DOB are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        console.log("Making request to Surepass API to verify passport with:", {
          fileNumber,
          dob,
          baseUrl
        });

        const response = await fetch(`${baseUrl}/api/v1/passport/passport/passport-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: fileNumber, dob })
        });

          
        // Check if response is OK before parsing JSON
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
          }

          const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'verify_passport_api_error',
            response: { error: errorData.message || `HTTP ${response.status}`, status: response.status }
          };

          await supabase.from('employee_documents').update({
            employee_docs_log: [...existingLogs, logEntry],
            api_verification_status: 'failed',
            api_verification_method: 'api',
            api_verification_date: null
          }).eq('id', documentId);

          let userFriendlyError = "Passport verification failed. Please try again.";
          let errorCode = "PASSPORT_VERIFICATION_FAILED";

          if (response.status === 401) {
            userFriendlyError = "Authentication failed. Please contact administrator.";
            errorCode = "AUTH_ERROR";
          } else if (response.status === 429) {
            userFriendlyError = "Too many verification attempts. Please try again after some time.";
            errorCode = "API_LIMIT_EXCEEDED";
          }
          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: response.status,
            message: response.statusText,
            response: response
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: errorData.message,
              status_code: response.status
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Parse JSON response
        let apiResponse;
        try {
          apiResponse = await response.json();
        } catch (parseError: any) {
          // If JSON parsing fails, it's likely a connection/network issue
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'verify_passport_api_error',
            response: { error: 'Failed to parse API response', parseError: parseError.message }
          };

          await supabase.from('employee_documents').update({
            employee_docs_log: [...existingLogs, logEntry],
            api_verification_status: 'failed',
            api_verification_method: 'api',
            api_verification_date: null
          }).eq('id', documentId);

          return new Response(
            JSON.stringify({
              success: false,
              error: "Verification service returned invalid response. Please try again.",
              errorCode: "INVALID_RESPONSE",
              originalError: parseError.message
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log("Surepass API passport verification response:", apiResponse);

        // Always append a log entry
        const logEntry = { timestamp: new Date().toISOString(), action: 'verify_passport_api', response: apiResponse };

        // On success (status_code 200), persist api_* columns and keep verification pending
        if (apiResponse?.success && apiResponse?.status_code === 200) {
          await supabase.from('employee_documents').update({
            verification_status: 'pending',
            employee_docs_log: [...existingLogs, logEntry],
            api_response_data: apiResponse,
            api_verification_status: 'completed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString()
          }).eq('id', documentId);
          
          await logVerificationSuccess(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: apiResponse.status_code,
            response: apiResponse
          });

          return new Response(
            JSON.stringify({
              success: true,
              data: apiResponse,
              message: "Passport API verification completed. Please review the response."
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "Passport verification failed";
          let errorCode = "PASSPORT_VERIFICATION_FAILED";

          if (apiResponse?.message) {
            const message = apiResponse.message.toLowerCase();
            if (message.includes('invalid passport') || message.includes('not found')) {
              userFriendlyError = "This Passport number is not found in government records";
              errorCode = "PASSPORT_INVALID";
            } else if (message.includes('format') || message.includes('pattern')) {
              userFriendlyError = "Please enter a valid Passport file number";
              errorCode = "PASSPORT_INVALID_FORMAT";
            } else if (message.includes('dob') || message.includes('date of birth')) {
              userFriendlyError = "Date of birth doesn't match with Passport records";
              errorCode = "PASSPORT_DOB_MISMATCH";
            } else {
              userFriendlyError = "Passport verification failed. Please check the details and try again.";
            }
          }

          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: apiResponse?.status_code,
            message: apiResponse?.message,
            response: apiResponse
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: apiResponse?.message,
              data: apiResponse,
              status_code: apiResponse?.status_code
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error: any) {
        console.error("Error verifying Passport with Surepass API:", error);

        // API call failed completely - set to failed status
        await supabase.from('employee_documents').update({
          employee_docs_log: [...existingLogs, {
            timestamp: new Date().toISOString(),
            action: 'verify_passport_api_error',
            response: { error: error.message, stack: error.stack }
          }],
          api_verification_status: 'failed',
          api_verification_method: 'api',
          api_verification_date: null
        }).eq('id', documentId);

        // Detect connection/timeout errors and provide user-friendly messages
        let userFriendlyError = "Something went wrong during Passport verification. Please try again.";
        let errorCode = "INTERNAL_ERROR";

        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('connection reset') || 
            errorMessage.includes('connection') || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('connect') ||
            errorMessage.includes('reset by peer')) {
          userFriendlyError = "Verification service is temporarily unavailable. Please try again.";
          errorCode = "CONNECTION_TIMEOUT";
        } else if (errorMessage.includes('429') || errorMessage.includes('limit')) {
          userFriendlyError = "Too many verification attempts. Please try again after some time.";
          errorCode = "API_LIMIT_EXCEEDED";
        } else if (errorMessage.includes('dns') || errorMessage.includes('resolve')) {
          userFriendlyError = "Unable to reach verification service. Please check your connection and try again.";
          errorCode = "NETWORK_ERROR";
        }

        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: "surepass",
          message: (error as Error).message,
          response: { error: (error as Error).message },
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: userFriendlyError,
            errorCode: errorCode,
            originalError: error.message,
            message: userFriendlyError
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'manualVerify') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: existing, error: docError } = await supabase.from('employee_documents').select('employee_docs_log').eq('id', documentId).single();
      const logs = existing?.employee_docs_log || [];

      await supabase.from('employee_documents').update({
        document_status_id: governanceStatusId,
        verification_status: 'verified',
        verified_by: verified_by_employee_id || null,
        employee_docs_log: [...logs, { timestamp: new Date().toISOString(), action: 'verify_passport_manual', notes: verification_notes || 'Document manually verified by staff.' }]
      }).eq('id', documentId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'approveAfterApi') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!verified_by_employee_id) {
        return new Response(JSON.stringify({ error: 'Employee ID is required for approval' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.from('employee_documents').update({
        document_status_id: governanceStatusId,
        verification_status: 'verified',
        verified_by: verified_by_employee_id,
        employee_docs_log: [...( (await supabase.from('employee_documents').select('employee_docs_log').eq('id', documentId).single()).data?.employee_docs_log || []), { timestamp: new Date().toISOString(), action: 'approve_after_api', notes: verification_notes || 'Approved after Passport API check' } ]
      }).eq('id', documentId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reject') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existing, error: docError } = await supabase.from('employee_documents').select('employee_docs_log').eq('id', documentId).single();
      const logs = existing?.employee_docs_log || [];

      await supabase.from('employee_documents').update({
        document_status_id: rejectedStatusId,
        verification_status: 'failed',
        verified_by: null,
        reject_reason: reject_reason || 'Document verification rejected by staff.',
        api_verification_date: null,
        employee_docs_log: [...logs, { timestamp: new Date().toISOString(), action: 'reject_passport', notes: reject_reason || 'Document verification rejected by staff.' }]
      }).eq('id', documentId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


