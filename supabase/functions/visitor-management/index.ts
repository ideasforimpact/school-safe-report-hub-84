/**
 * Visitor Management API
 * CRUD operations for visitors with file upload support
 * Files stored in: visitors_evidence/{client_id}/{employee_id}/
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const BUCKET_NAME = 'visitors_evidence';

// Helper function to decode base64
function decodeBase64(base64: string): Uint8Array {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Transform DB visitor row so API returns a single vehicle_type object
// vehicle_type: { id, key, name, active } and removes vehicle_type_info helper
function transformVisitorRow(row: any): any {
  if (!row) return row;

  const transformed: any = { ...row };

  if (row.vehicle_type_info) {
    transformed.vehicle_type = {
      id: row.vehicle_type_info.id,
      key: row.vehicle_type_info.key,
      name: row.vehicle_type_info.name,
      active: row.vehicle_type_info.active,
    };
  }

  delete transformed.vehicle_type_info;

  return transformed;
}

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Helper function to upload files to storage
async function uploadFiles(
  supabase: any,
  files: Array<{ name: string; type: string; base64: string }>,
  clientId: string,
  employeeId: string
): Promise<Array<{ name: string; path: string; url: string; type: string }>> {
  const uploadedFiles = [];
  const baseFolder = `${clientId}/${employeeId}`;

  for (const file of files) {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const sanitized = sanitizeFilename(file.name);
      const filePath = `${baseFolder}/${timestamp}_${randomStr}_${sanitized}`;

      // Decode base64 and upload
      const fileData = decodeBase64(file.base64);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileData, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        name: file.name,
        path: filePath,
        url: publicUrl,
        type: file.type || 'application/octet-stream'
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  return uploadedFiles;
}

// Helper function to extract and verify token, then get employee and client info
async function getAuthenticatedUserInfo(req: Request, supabase: any): Promise<{
  employeeId: string;
  clientId: string;
  error?: Response;
}> {
  // Extract token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Authorization header with Bearer token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the token
  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (error) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Get employee_id from token (sub field)
  const employeeId = payload.sub;
  console.log('Employee ID from token:', employeeId);
  
  // Try to get client_id from token payload first
  let clientId = payload.client_id || payload.clientId || null;
  
  // If client_id is not in token, fetch from employee record
  if (!clientId) {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, client_id, status')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return {
        employeeId: '',
        clientId: '',
        error: new Response(
          JSON.stringify({ error: 'Employee not found' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      };
    }

    if (!employee.status) {
      return {
        employeeId: '',
        clientId: '',
        error: new Response(
          JSON.stringify({ error: 'Employee account is inactive' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      };
    }

    clientId = employee.client_id;
  }

  if (!clientId) {
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Client ID not found in token or employee record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  console.log('Client ID:', clientId);
  console.log('Employee ID:', employeeId);

  return {
    employeeId: employeeId,
    clientId: clientId
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const url = new URL(req.url);
    const method = req.method;

    // Extract and verify token, get employee_id and client_id
    const authInfo = await getAuthenticatedUserInfo(req, supabase);
    if (authInfo.error) {
      return authInfo.error;
    }

    const authenticatedEmployeeId = authInfo.employeeId;
    const authenticatedClientId = authInfo.clientId;

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      authenticatedClientId,
      url.pathname
    );
    
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - List visitors or get single visitor
    if (method === 'GET') {
      const visitorId = url.searchParams.get('id');

      if (visitorId) {
        // Get single visitor - must belong to authenticated user's client and employee
        const { data, error } = await supabase
          .from('visitors')
          .select('*, visitor_kyc(*), vehicle_type_info:visitor_vehicle_type(id, name, key, active)')
          .eq('id', visitorId)
          .eq('client_id', authenticatedClientId) // Enforce client_id match
          .eq('employee_id', authenticatedEmployeeId) // Enforce employee_id match
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Visitor not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: transformVisitorRow(data) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // List visitors - filtered by authenticated user's client_id and employee_id
        const { data, error } = await supabase
          .from('visitors')
          .select('*, visitor_kyc(*), vehicle_type_info:visitor_vehicle_type(id, name, key, active)')
          .eq('client_id', authenticatedClientId) // Always filter by authenticated client
          .eq('employee_id', authenticatedEmployeeId) // Always filter by authenticated employee
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const transformed = Array.isArray(data) ? data.map(transformVisitorRow) : data;

        return new Response(
          JSON.stringify({ data: transformed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST - Create visitor
    if (method === 'POST') {
      const body = await req.json();
      const { name, mobile_no, purpose, whom_to_meet, employee_id, files, kyc_details, vehicle_no, vehicle_type } = body;

      // Validate required fields (client_id comes from token, employee_id is optional - defaults to authenticated user)
      if (!name || !mobile_no || !purpose || !whom_to_meet) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: name, mobile_no, purpose, whom_to_meet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use authenticated client_id and employee_id (or provided employee_id if valid)
      const clientId = authenticatedClientId;
      const effectiveEmployeeId = employee_id || authenticatedEmployeeId;

      // Validate that provided employee_id (if any) belongs to the same client
      if (employee_id && employee_id !== authenticatedEmployeeId) {
        const { data: targetEmployee, error: empError } = await supabase
          .from('employees')
          .select('id, client_id')
          .eq('id', employee_id)
          .single();

        if (empError || !targetEmployee || targetEmployee.client_id !== clientId) {
          return new Response(
            JSON.stringify({ error: 'Invalid employee_id or employee does not belong to your client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate vehicle_type UUID against visitor_vehicle_type table if provided
      if (vehicle_type !== undefined && vehicle_type !== null) {
        if (typeof vehicle_type !== 'string' || !vehicle_type.trim()) {
          return new Response(
            JSON.stringify({ error: 'vehicle_type must be a non-empty UUID string' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: vehicleTypeRow, error: vehicleTypeError } = await supabase
          .from('visitor_vehicle_type')
          .select('id, active')
          .eq('id', vehicle_type)
          .single();

        if (vehicleTypeError || !vehicleTypeRow) {
          return new Response(
            JSON.stringify({ error: 'Invalid vehicle_type: not found in visitor_vehicle_type table' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (vehicleTypeRow.active === false) {
          return new Response(
            JSON.stringify({ error: 'Selected vehicle_type is inactive' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Upload files if provided
      let evidenceFiles: any[] = [];
      if (files && Array.isArray(files) && files.length > 0) {
        try {
          evidenceFiles = await uploadFiles(supabase, files, clientId, effectiveEmployeeId);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create visitor record
      const visitorData: any = {
        name,
        mobile_no,
        purpose,
        whom_to_meet,
        client_id: clientId,
        employee_id: effectiveEmployeeId,
        evidence_files: evidenceFiles
      };

      // Add vehicle fields if provided
      if (vehicle_no !== undefined) visitorData.vehicle_no = vehicle_no;
      if (vehicle_type !== undefined) visitorData.vehicle_type = vehicle_type;

      const { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .insert(visitorData)
        .select()
        .single();

      if (visitorError) {
        return new Response(
          JSON.stringify({ error: visitorError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create KYC details if provided
      if (kyc_details && Array.isArray(kyc_details) && kyc_details.length > 0) {
        const kycRecords = kyc_details.map((kyc: any) => ({
          visitor_id: visitor.id,
          client_id: clientId,
          employee_id: effectiveEmployeeId,
          document_type: kyc.document_type,
          document_no: kyc.document_no
        }));

        const { error: kycError } = await supabase
          .from('visitor_kyc')
          .insert(kycRecords);

        if (kycError) {
          console.error('Error creating KYC records:', kycError);
          // Continue anyway - visitor is already created
        }
      }

      // Fetch complete visitor data with KYC and vehicle type info
      const { data: completeVisitor, error: fetchError } = await supabase
        .from('visitors')
        .select('*, visitor_kyc(*), vehicle_type_info:visitor_vehicle_type(id, name, key, active)')
        .eq('id', visitor.id)
        .single();

      return new Response(
        JSON.stringify({ data: transformVisitorRow(completeVisitor || visitor) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update visitor
    if (method === 'PUT') {
      const body = await req.json();
      const { id, name, mobile_no, purpose, whom_to_meet, employee_id, files, kyc_details, vehicle_no, vehicle_type } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get existing visitor - must belong to authenticated user's client
      const { data: existingVisitor, error: fetchError } = await supabase
        .from('visitors')
        .select('client_id, employee_id, evidence_files')
        .eq('id', id)
        .eq('client_id', authenticatedClientId) // Enforce client_id match
        .single();

      if (fetchError || !existingVisitor) {
        return new Response(
          JSON.stringify({ error: 'Visitor not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const clientId = authenticatedClientId; // Use authenticated client_id
      let effectiveEmployeeId = employee_id || existingVisitor.employee_id;

      // Validate that provided employee_id (if any) belongs to the same client
      if (employee_id && employee_id !== existingVisitor.employee_id) {
        const { data: targetEmployee, error: empError } = await supabase
          .from('employees')
          .select('id, client_id')
          .eq('id', employee_id)
          .single();

        if (empError || !targetEmployee || targetEmployee.client_id !== clientId) {
          return new Response(
            JSON.stringify({ error: 'Invalid employee_id or employee does not belong to your client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        effectiveEmployeeId = employee_id;
      }

      // Validate vehicle_type UUID against visitor_vehicle_type table if provided
      if (vehicle_type !== undefined && vehicle_type !== null) {
        if (typeof vehicle_type !== 'string' || !vehicle_type.trim()) {
          return new Response(
            JSON.stringify({ error: 'vehicle_type must be a non-empty UUID string' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: vehicleTypeRow, error: vehicleTypeError } = await supabase
          .from('visitor_vehicle_type')
          .select('id, active')
          .eq('id', vehicle_type)
          .single();

        if (vehicleTypeError || !vehicleTypeRow) {
          return new Response(
            JSON.stringify({ error: 'Invalid vehicle_type: not found in visitor_vehicle_type table' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (vehicleTypeRow.active === false) {
          return new Response(
            JSON.stringify({ error: 'Selected vehicle_type is inactive' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Upload new files if provided
      let newFiles: any[] = [];
      if (files && Array.isArray(files) && files.length > 0) {
        try {
          newFiles = await uploadFiles(supabase, files, clientId, effectiveEmployeeId);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Merge with existing files
      const existingFiles = Array.isArray(existingVisitor.evidence_files) ? existingVisitor.evidence_files : [];
      const updatedFiles = [...existingFiles, ...newFiles];

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (mobile_no !== undefined) updateData.mobile_no = mobile_no;
      if (purpose !== undefined) updateData.purpose = purpose;
      if (whom_to_meet !== undefined) updateData.whom_to_meet = whom_to_meet;
      if (employee_id !== undefined) updateData.employee_id = employee_id;
      if (vehicle_no !== undefined) updateData.vehicle_no = vehicle_no;
      if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
      if (newFiles.length > 0) updateData.evidence_files = updatedFiles;

      // Update visitor
      const { data: updatedVisitor, error: updateError } = await supabase
        .from('visitors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update KYC details if provided
      if (kyc_details && Array.isArray(kyc_details)) {
        // Delete existing KYC records
        await supabase
          .from('visitor_kyc')
          .delete()
          .eq('visitor_id', id);

        // Insert new KYC records
        if (kyc_details.length > 0) {
          const kycRecords = kyc_details.map((kyc: any) => ({
            visitor_id: id,
            client_id: clientId,
            employee_id: effectiveEmployeeId,
            document_type: kyc.document_type,
            document_no: kyc.document_no
          }));

          await supabase
            .from('visitor_kyc')
            .insert(kycRecords);
        }
      }

      // Fetch complete visitor data with KYC and vehicle type info
      const { data: completeVisitor, error: fetchError2 } = await supabase
        .from('visitors')
        .select('*, visitor_kyc(*), vehicle_type_info:visitor_vehicle_type(id, name, key, active)')
        .eq('id', id)
        .single();

      return new Response(
        JSON.stringify({ data: transformVisitorRow(completeVisitor || updatedVisitor) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete visitor
    if (method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get visitor to get file paths for cleanup - must belong to authenticated user's client
      const { data: visitor, error: fetchError } = await supabase
        .from('visitors')
        .select('evidence_files, client_id, employee_id')
        .eq('id', id)
        .eq('client_id', authenticatedClientId) // Enforce client_id match
        .single();

      if (fetchError || !visitor) {
        return new Response(
          JSON.stringify({ error: 'Visitor not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete files from storage
      if (visitor.evidence_files && Array.isArray(visitor.evidence_files)) {
        const filePaths = visitor.evidence_files.map((file: any) => file.path).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(filePaths);

          if (deleteError) {
            console.error('Error deleting files:', deleteError);
            // Continue with visitor deletion even if file deletion fails
          }
        }
      }

      // Delete visitor (KYC records will be deleted via CASCADE)
      const { error: deleteError } = await supabase
        .from('visitors')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Visitor deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in visitor-management:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

