/**
 * Visitor Management API
 * CRUD operations for visitors with file upload support
 * Files stored in: visitors_evidence/{client_id}/{employee_id}/
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { verifyAccessToken } from '../_shared/safe-school/jwt.ts';
import { getCorsHeaders, corsHeaders } from '../_shared/cors.ts';
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

// Helper function to calculate validity based on validity_from and validity_to
// NOTE: This mirrors the logic in TrustedVehiclesPage.getValidityStatus:
// A vehicle is considered valid as long as its end date has not passed,
// even if the start date is in the future.
function calculateValidity(validityFrom: string | Date | null, validityTo: string | Date | null): boolean {
  if (!validityTo) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const toDate = new Date(validityTo);
  toDate.setHours(0, 0, 0, 0);
  
  // A vehicle is considered valid as long as its end date has not passed.
  // Even if the start date is in the future, it should be shown as "Valid"
  // until the end date crosses the current date.
  return toDate >= today;
}

// Transform trusted vehicle row to match required structure
function transformTrustedVehicleRow(row: any): any {
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.vehicle_name || row.name || '', // Use vehicle_name as name
    type: row.type || '',
    vehicle_no: row.vehicle_no || '',
    client_id: row.client_id,
    employee_id: row.employee_id,
    entry_status: row.entry_status || null,
    in_time: row.in_time || null,
    exit_time: row.exit_time || null,
    is_validity: calculateValidity(row.validity_from, row.validity_to),
    is_trusted_vehicle: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Helper function to detect MIME type from filename extension
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    'html': 'text/html',
    'xml': 'text/xml',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// Helper function to upload files to storage
// Returns only paths (not URLs) to avoid exposing storage URLs in database
async function uploadFiles(
  supabase: any,
  files: Array<{ name: string; type: string; base64: string }>,
  clientId: string,
  employeeId: string,
  visitorId: string
): Promise<Array<{ name: string; path: string; type: string }>> {
  const uploadedFiles: Array<{ name: string; path: string; type: string }> = [];
  // Store files in structure: {client_id}/{employee_id}/{visitor_id}/filename
  const baseFolder = `${clientId}/${employeeId}/${visitorId}`;

  for (const file of files) {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const sanitized = sanitizeFilename(file.name);
      const filePath = `${baseFolder}/${timestamp}_${randomStr}_${sanitized}`;

      // Detect correct content type from filename if file.type is missing or generic
      let contentType = file.type;
      if (!contentType || contentType === 'application/octet-stream' || contentType === '') {
        contentType = getMimeTypeFromFilename(file.name);
      }

      // Decode base64 and upload
      const fileData = decodeBase64(file.base64);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileData, {
          contentType: contentType,
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      // Store only the path, not the URL, with correct content type
      uploadedFiles.push({
        name: file.name,
        path: filePath,
        type: contentType
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  return uploadedFiles;
}

// Helper function to transform stored paths to full URLs when fetching
// This ensures URLs are generated based on the current environment
function transformEvidenceFiles(
  evidenceFiles: any[],
  supabaseUrl: string
): Array<{ name: string; path: string; url: string; type: string }> {
  if (!Array.isArray(evidenceFiles)) {
    return [];
  }

  return evidenceFiles.map((file: any) => {
    // If file already has a URL, check if it's a valid path-based structure
    // Otherwise, construct URL from path
    let url = file.url;
    
    if (file.path && !url) {
      // Construct public URL from path
      // Format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
      url = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${file.path}`;
    } else if (file.path && url && url.includes('/sign/')) {
      // If URL contains /sign/, it's likely from old format, reconstruct from path
      url = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${file.path}`;
    }

    return {
      name: file.name || 'Unknown',
      path: file.path || '',
      url: url || '',
      type: file.type 
    };
  });
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
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      )
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the token
  let payload;
  try {
    payload = await verifyAccessToken(token);
    console.log(payload,"PAYLOAD");
    
  } catch (error) {
    console.log(error,"error");
    
    return {
      employeeId: '',
      clientId: '',
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired access token' }),
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
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
          { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
        )
      };
    }

    if (!employee.status) {
      return {
        employeeId: '',
        clientId: '',
        error: new Response(
          JSON.stringify({ error: 'Employee account is inactive' }),
          { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
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
        { status: 400, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
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
  // Get CORS headers with origin support
  const corsHeadersWithOrigin = getCorsHeaders(req);
  
  // Handle CORS preflight - MUST return CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeadersWithOrigin,
        'Content-Length': '0'
      }
    });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const url = new URL(req.url);
    const method = req.method;

    // Extract and verify token, get employee_id and client_id
    const authInfo = await getAuthenticatedUserInfo(req, supabase);
    if (authInfo.error) {
      // Ensure CORS headers are included in error response
      const errorResponse = authInfo.error;
      const errorHeaders = new Headers(errorResponse.headers);
      Object.entries(corsHeadersWithOrigin).forEach(([key, value]) => {
        errorHeaders.set(key, value);
      });
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        headers: errorHeaders
      });
    }

    const authenticatedEmployeeId = authInfo.employeeId;
    const authenticatedClientId = authInfo.clientId;

    // Validate IP whitelist
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
        { status: 403, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // GET - List visitors or get single visitor
    if (method === 'GET') {
      const visitorId = url.searchParams.get('id');

      const supabaseUrl = getSupabaseUrl();

      // Fetch trusted vehicles - filtered by client_id, employee_id, and entry_status = 'IN'
      // Include in_time, exit_time, created_at, updated_at so they are available in the API response
      const { data: trustedVehiclesData, error: trustedVehiclesError } = await supabase
        .from('trusted_vehicle')
        .select('id, vehicle_name, type, vehicle_no, client_id, employee_id, entry_status, validity_from, validity_to, in_time, exit_time, created_at, updated_at')
        .eq('client_id', authenticatedClientId)
        .eq('employee_id', authenticatedEmployeeId)
        .eq('entry_status', 'IN');

      // Transform trusted vehicles
      const trustedVehicles = trustedVehiclesError || !trustedVehiclesData
        ? []
        : trustedVehiclesData.map((tv: any) => transformTrustedVehicleRow(tv)).filter((tv: any) => tv !== null);

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
            { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        // Transform evidence files paths to URLs
        const transformedData = transformVisitorRow(data);
        if (transformedData.evidence_files) {
          transformedData.evidence_files = transformEvidenceFiles(transformedData.evidence_files, supabaseUrl);
        }

        return new Response(
          JSON.stringify({ 
            data: transformedData,
            trusted_vehicles: trustedVehicles
          }),
          { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
            { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        // Transform evidence files paths to URLs for each visitor
        const transformed = Array.isArray(data) 
          ? data.map((visitor: any) => {
              const transformedVisitor = transformVisitorRow(visitor);
              if (transformedVisitor.evidence_files) {
                transformedVisitor.evidence_files = transformEvidenceFiles(transformedVisitor.evidence_files, supabaseUrl);
              }
              return transformedVisitor;
            })
          : data;

        return new Response(
          JSON.stringify({ 
            data: transformed,
            trusted_vehicles: trustedVehicles
          }),
          { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate vehicle_type UUID against visitor_vehicle_type table if provided
      if (vehicle_type !== undefined && vehicle_type !== null) {
        if (typeof vehicle_type !== 'string' || !vehicle_type.trim()) {
          return new Response(
            JSON.stringify({ error: 'vehicle_type must be a non-empty UUID string' }),
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        if (vehicleTypeRow.active === false) {
          return new Response(
            JSON.stringify({ error: 'Selected vehicle_type is inactive' }),
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create visitor record first (without files) to get visitor_id
      const visitorData: any = {
        name,
        mobile_no,
        purpose,
        whom_to_meet,
        client_id: clientId,
        employee_id: effectiveEmployeeId,
        evidence_files: []
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
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      // Upload files if provided (now we have visitor_id)
      let evidenceFiles: any[] = [];
      if (files && Array.isArray(files) && files.length > 0) {
        try {
          evidenceFiles = await uploadFiles(supabase, files, clientId, effectiveEmployeeId, visitor.id);
          
          // Update visitor with evidence files (paths only, not URLs)
          const { error: updateError } = await supabase
            .from('visitors')
            .update({ evidence_files: evidenceFiles })
            .eq('id', visitor.id);

          if (updateError) {
            console.error('Error updating visitor with evidence files:', updateError);
            // Continue anyway - files are uploaded but visitor record update failed
          }
        } catch (error) {
          // If file upload fails, delete the visitor record
          await supabase.from('visitors').delete().eq('id', visitor.id);
          return new Response(
            JSON.stringify({ error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
            { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }
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

      const supabaseUrl = getSupabaseUrl();
      const transformedData = transformVisitorRow(completeVisitor || visitor);
      
      // Transform evidence files paths to URLs
      if (transformedData.evidence_files) {
        transformedData.evidence_files = transformEvidenceFiles(transformedData.evidence_files, supabaseUrl);
      }

      return new Response(
        JSON.stringify({ data: transformedData }),
        { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update visitor
    if (method === 'PUT') {
      const body = await req.json();
      const { id, name, mobile_no, purpose, whom_to_meet, employee_id, files, kyc_details, vehicle_no, vehicle_type } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
          { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }
        effectiveEmployeeId = employee_id;
      }

      // Validate vehicle_type UUID against visitor_vehicle_type table if provided
      if (vehicle_type !== undefined && vehicle_type !== null) {
        if (typeof vehicle_type !== 'string' || !vehicle_type.trim()) {
          return new Response(
            JSON.stringify({ error: 'vehicle_type must be a non-empty UUID string' }),
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }

        if (vehicleTypeRow.active === false) {
          return new Response(
            JSON.stringify({ error: 'Selected vehicle_type is inactive' }),
            { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Handle files update: separate new files (with base64) from existing files (with path/url)
      let finalEvidenceFiles: any[] = [];
      
      // Check if files parameter was provided (even if empty array)
      if (files !== undefined) {
        if (Array.isArray(files) && files.length > 0) {
          // Separate new files (have base64) from existing files (have path/url, no base64)
          const newFilesToUpload = files.filter((file: any) => file.base64 && !file.path);
          const existingFilesToKeep = files.filter((file: any) => file.path && !file.base64);
          
          // Upload new files if any
          let uploadedNewFiles: any[] = [];
          if (newFilesToUpload.length > 0) {
            try {
              uploadedNewFiles = await uploadFiles(supabase, newFilesToUpload, clientId, effectiveEmployeeId, id);
            } catch (error) {
              return new Response(
                JSON.stringify({ error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
                { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
              );
            }
          }
          
          // Process existing files to keep - extract only path, name, type (remove url as it will be regenerated)
          const processedExistingFiles = existingFilesToKeep.map((file: any) => ({
            name: file.name,
            path: file.path,
            type: file.type 
          }));
          
          // Combine: existing files to keep + newly uploaded files
          // This replaces the evidence_files column - files not included in the request are effectively removed
          // Example: If visitor has 3 files and you send only 2 files, the 3rd file will be removed from the column
          // Note: Files are NOT deleted from storage, only removed from the evidence_files column
          finalEvidenceFiles = [...processedExistingFiles, ...uploadedNewFiles];
        } else {
          // If files is an empty array [], clear all files
          finalEvidenceFiles = [];
        }
      } else {
        // If files parameter is not provided (undefined), keep existing files (no change)
        finalEvidenceFiles = Array.isArray(existingVisitor.evidence_files) ? existingVisitor.evidence_files : [];
      }

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
      
      // Update evidence_files if files were provided (even if empty array to clear files)
      if (files !== undefined) {
        updateData.evidence_files = finalEvidenceFiles;
      }

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
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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

      const supabaseUrl = getSupabaseUrl();
      const transformedData = transformVisitorRow(completeVisitor || updatedVisitor);
      
      // Transform evidence files paths to URLs
      if (transformedData.evidence_files) {
        transformedData.evidence_files = transformEvidenceFiles(transformedData.evidence_files, supabaseUrl);
      }

      return new Response(
        JSON.stringify({ data: transformedData }),
        { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete visitor
    if (method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          { status: 400, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
          { status: 404, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
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
          { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Visitor deleted successfully' }),
        { headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in visitor-management:', error);
    // Ensure CORS headers are ALWAYS returned, even for unhandled errors
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
});

