import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts'
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
 
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
 
  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    )
 
    console.log("Auth header present:", req.headers.get('Authorization') ? 'Yes' : 'No');
 
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);
 
    const requestData = JSON.parse(rawBody);
    const { operation, employee, id, employees, clientId } = requestData;
    
    console.log("Request data parsed successfully:", { operation, employee, id, employees: employees?.length, clientId });
 
    console.log("Handling operation:", operation);
 
    // Validate client exists for operations that need it
    if (operation === 'create' || operation === 'update' || operation === 'bulk_import') {
      // Extract clientId from different possible locations
      let validationClientId = null;
      
      if (clientId) {
        validationClientId = clientId;
      } else if (employee?.clientId) {
        validationClientId = employee.clientId;
      } else if (employee?.client_id) {
        validationClientId = employee.client_id;
      }
      
      console.log("Extracted clientId for validation:", validationClientId);
      
      if (!validationClientId) {
        console.error("No client ID found for operation:", operation);
        return new Response(
          JSON.stringify({
            error: "Client ID is required",
            details: `No clientId found for operation: ${operation}`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
 
      console.log("Validating client with ID:", validationClientId);
 
      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('id', validationClientId)
        .single();
 
      if (clientError || !client) {
        console.error("Client validation error:", clientError);
        return new Response(
          JSON.stringify({
            error: "Invalid client ID",
            details: `Client with ID ${validationClientId} not found`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log("Client validation successful for:", validationClientId);
 
      // Validate IP whitelist
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(
        supabaseClient,
        req,
        validationClientId,
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
    }
 
    switch (operation) {
      case 'create':
        return await handleCreate(supabaseClient, employee);
      case 'update':
        return await handleUpdate(supabaseClient, employee);
      case 'delete':
        return await handleDelete(supabaseClient, id);
      case 'deactivate':
        return await handleDeactivate(supabaseClient, id);
      case 'reactivate':
        return await handleReactivate(supabaseClient, id);
      case 'bulk_import':
        return await handleBulkImport(supabaseClient, employees, clientId);
      default:
        console.error("Invalid operation received:", operation);
        return new Response(
          JSON.stringify({
            error: "Invalid operation",
            details: `Operation '${operation}' is not supported. Supported operations: create, update, delete, deactivate, reactivate, bulk_import`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error("Error in employee-management function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
 
// Helper function to map employee_type text to UUID
async function getEmployeeTypeId(supabaseClient: any, employeeType: string): Promise<string | null> {
  // If it's already a UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(employeeType)) {
    return employeeType;
  }
 
  // Normalize the text value
  const normalizedType = employeeType.toLowerCase().trim();
  
  // Map common variations
  const typeMapping: Record<string, string> = {
    'permanent': 'permanent',
    'contract': 'contract',
    'consultant': 'consultant',
    'part_time': 'part_time',
    'part-time': 'part_time',
    'parttime': 'part_time',
    'full-time': 'permanent',
    'fulltime': 'permanent',
    'intern': 'consultant' // Map intern to consultant as fallback
  };
 
  const mappedType = typeMapping[normalizedType] || normalizedType;
 
  // Fetch the employee_type ID from the database
  const { data: employeeTypeData, error } = await supabaseClient
    .from('employee_type')
    .select('id')
    .eq('type_name', mappedType)
    .maybeSingle();
 
  if (error) {
    console.error("Error fetching employee_type:", error);
    return null;
  }
 
  if (!employeeTypeData) {
    console.warn(`Employee type '${employeeType}' not found, returning null`);
    return null;
  }
 
  return employeeTypeData.id;
}
 
// Helper function to map department text to UUID
async function getDepartmentId(supabaseClient: any, department: string): Promise<string | null> {
  // If it's already a UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(department)) {
    return department;
  }
 
  // Normalize the text value
  const normalizedDept = department.toLowerCase().trim();
  
  // Map common variations
  const deptMapping: Record<string, string> = {
    'admin': 'admin',
    'administration': 'admin',
    'teaching': 'teaching',
    'security': 'security',
    'maintenance': 'maintenance',
    'transport': 'transport',
    'management': 'management',
    'operations': 'admin' // Map operations to admin as fallback
  };
 
  const mappedDept = deptMapping[normalizedDept] || normalizedDept;
 
  // Fetch the employee_departments ID from the database
  const { data: departmentData, error } = await supabaseClient
    .from('employee_departments')
    .select('id')
    .eq('department_name', mappedDept)
    .maybeSingle();
 
  if (error) {
    console.error("Error fetching employee_departments:", error);
    return null;
  }
 
  if (!departmentData) {
    console.warn(`Department '${department}' not found, returning null`);
    return null;
  }
 
  return departmentData.id;
}

async function insertEmployeePersonalDetails(
  supabaseClient: any,
  employeeId: string,
  clientId: string | null | undefined,
  employee: any
) {
  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const { data: employeeRow } = await supabaseClient
      .from('employees')
      .select('client_id')
      .eq('id', employeeId)
      .maybeSingle();
    resolvedClientId = employeeRow?.client_id ?? null;
  }
  if (!resolvedClientId) {
    throw new Error(`Missing client_id for employee personal details upsert: ${employeeId}`);
  }

  const nestedPersonal = employee.personalDetails || {};
  const normalizeOptional = (value: any) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  };
  const personalDetails = {
    employee_id: employeeId,
    client_id: resolvedClientId,
    middle_name: normalizeOptional(nestedPersonal.middleName ?? employee.middleName),
    father_name: normalizeOptional(nestedPersonal.fatherName ?? employee.fatherName),
    gender: normalizeOptional(nestedPersonal.gender ?? employee.gender),
    dob: normalizeOptional(nestedPersonal.dob ?? employee.dob),
    religion: normalizeOptional(nestedPersonal.religion ?? employee.religion),
    nationality: normalizeOptional(nestedPersonal.nationality ?? employee.nationality),
    blood_group: normalizeOptional(nestedPersonal.bloodGroup ?? employee.bloodGroup),
    residence_address: normalizeOptional(nestedPersonal.residenceAddress ?? employee.residenceAddress),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient
    .from('employee_personal_details')
    .upsert(personalDetails, { onConflict: 'employee_id' });

  if (error) {
    console.error('Error inserting employee personal details:', error);
    throw error;
  }
}

async function insertEmployeeOtherDetails(
  supabaseClient: any,
  employeeId: string,
  clientId: string | null | undefined,
  employee: any
) {
  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const { data: employeeRow } = await supabaseClient
      .from('employees')
      .select('client_id')
      .eq('id', employeeId)
      .maybeSingle();
    resolvedClientId = employeeRow?.client_id ?? null;
  }
  if (!resolvedClientId) {
    throw new Error(`Missing client_id for employee other details upsert: ${employeeId}`);
  }

  const nestedProfessional = employee.professionalOtherDetails || {};
  const normalizeOptional = (value: any) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  };
  const otherDetails = {
    employee_id: employeeId,
    client_id: resolvedClientId,
    aadhaar_number: normalizeOptional(nestedProfessional.aadharNo ?? employee.aadharNo),
    pan_number: normalizeOptional(nestedProfessional.panNo ?? employee.panNo),
    esi_number: normalizeOptional(nestedProfessional.esiNo ?? employee.esiNo),
    pf_number: normalizeOptional(nestedProfessional.pfNo ?? employee.pfNo),
    exit_date: normalizeOptional(nestedProfessional.exitDate ?? employee.exitDate),
    biometric_user_id: normalizeOptional(nestedProfessional.biometricUserId ?? employee.biometricUserId),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient
    .from('employee_other_details')
    .upsert(otherDetails, { onConflict: 'employee_id' });

  if (error) {
    console.error('Error inserting employee other details:', error);
    throw error;
  }
}

async function uploadEmployeeProfileDocuments(
  supabaseClient: any,
  clientId: string,
  employeeKey: string,
  documents: any[]
) {
  if (!Array.isArray(documents) || documents.length === 0) return [];

  const bucketName = 'employee_profile_documents';
  const now = new Date().toISOString();
  const processedDocuments: any[] = [];

  for (const doc of documents) {
    if (!doc || !doc.key) continue;

    const normalizedDoc = {
      key: doc.key,
      fileName: doc.fileName || 'document',
      uploadedAt: doc.uploadedAt || now,
    } as any;

    const fileData = typeof doc.fileData === 'string' ? doc.fileData : '';
    if (!fileData) {
      const existingPath =
        doc.filePath || doc.file_path || doc.storagePath || doc.storage_path || undefined;
      processedDocuments.push({
        ...normalizedDoc,
        ...(existingPath ? { filePath: existingPath } : {}),
      });
      continue;
    }

    let bytes: Uint8Array;
    try {
      const binary = atob(fileData);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } catch (error) {
      console.error('Invalid base64 document payload:', error);
      throw new Error(`Invalid file data for ${doc.key}`);
    }

    const safeFileName = String(doc.fileName || 'document').replace(/\s+/g, '_');
    const storagePath = `${clientId}/${employeeKey}/${doc.key}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(storagePath, bytes, {
        upsert: false,
        contentType: doc.contentType || 'application/octet-stream',
      });

    if (uploadError) {
      console.error(`Failed to upload ${doc.key}:`, uploadError);
      throw new Error(`Failed to upload ${doc.key}`);
    }

    processedDocuments.push({
      ...normalizedDoc,
      filePath: storagePath,
    });
  }

  // Store only the compact shape in employees.documents and keep one row per doc key.
  const byKey = new Map<string, { key: string; fileName: string; filePath?: string; uploadedAt: string }>();
  for (const doc of processedDocuments) {
    const key = String(doc?.key || '').trim();
    if (!key) continue;
    const fileName = String(doc?.fileName || 'document').trim() || 'document';
    const filePath = (doc?.filePath || doc?.file_path || '').trim() || undefined;
    const uploadedAt = String(doc?.uploadedAt || now);

    byKey.set(key, {
      key,
      fileName,
      ...(filePath ? { filePath } : {}),
      uploadedAt,
    });
  }

  return Array.from(byKey.values());
}
 
async function handleBulkImport(supabaseClient: any, employees: any[], clientId: string) {
  console.log("Processing bulk import for", employees?.length, "employees with clientId:", clientId);
  
  if (!Array.isArray(employees) || employees.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Employees array is required and must not be empty",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  // Collect non-empty emails and employee IDs for duplicate checks
  const emails = employees
    .map(e => e.email?.toLowerCase())
    .filter((email: string | undefined) => !!email);
  const employeeIds = employees
    .map(e => e.employeeId)
    .filter((id: string | undefined) => !!id);
 
  let existingEmployees: any[] | null = null;
  let fetchError: any = null;

  if (emails.length > 0 || employeeIds.length > 0) {
    let query = supabaseClient
      .from("employees")
      .select("email, employee_id")
      .eq("client_id", clientId);

    const conditions: string[] = [];
    if (emails.length > 0) {
      conditions.push(`email.in.(${emails.join(",")})`);
    }
    if (employeeIds.length > 0) {
      conditions.push(`employee_id.in.(${employeeIds.join(",")})`);
    }

    if (conditions.length > 0) {
      const { data, error } = await query.or(conditions.join(","));
      existingEmployees = data;
      fetchError = error;
    }
  }
 
  if (fetchError) {
    console.error("Duplicate check failed:", fetchError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to check existing employees",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
 
  const existingEmailSet = new Set(
    (existingEmployees || []).map(e => e.email?.toLowerCase())
  );
  const existingIdSet = new Set(
    (existingEmployees || []).map(e => e.employee_id)
  );
 
  const insertPayload: any[] = [];
  const errors: string[] = [];
 
  for (const emp of employees) {
    // Employee ID is required; email is optional
    if (!emp.employeeId) {
      errors.push("Missing employeeId");
      continue;
    }
 
    // Map employee_type and department only when explicitly provided (omit or empty = null)
    const hasEmpType = emp.employeeType !== undefined && emp.employeeType !== null && String(emp.employeeType).trim() !== '';
    const hasDept = emp.department !== undefined && emp.department !== null && String(emp.department).trim() !== '';
    const employeeTypeId = hasEmpType ? await getEmployeeTypeId(supabaseClient, emp.employeeType) : null;
    const departmentId = hasDept ? await getDepartmentId(supabaseClient, emp.department) : null;
    insertPayload.push({
      employee_id: emp.employeeId,
      first_name: emp.firstName,
      last_name: emp.lastName || null,
      email: emp.email || null,
      employee_type: employeeTypeId,
      department: departmentId,
      designation: emp.designation || null,
      joining_date: emp.joiningDate,
      phone: emp.phone || null,
      status: true,
      client_id: clientId,
      user_id: emp.user_id || null,
      is_super_admin: emp.is_super_admin || false,
      is_cpd_involved: emp.is_cpd_involved === true,
      documents: Array.isArray(emp.documents) ? emp.documents : [],
    });
  }
  
  let insertedEmployees: any[] = [];
 
  if (insertPayload.length > 0) {
    const { data, error: insertError } = await supabaseClient
      .from("employees")
      .insert(insertPayload)
      .select("id, employee_id");
 
    if (insertError) {
      console.error("Insert failed:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to insert employees",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
 
    insertedEmployees = data || [];
  }
 
  for (let i = 0; i < insertedEmployees.length; i++) {
    const emp = employees[i];
    const employeeId = insertedEmployees[i]?.id;
 
    if (!employeeId) continue;

    await insertEmployeePersonalDetails(supabaseClient, employeeId, clientId, emp);
    await insertEmployeeOtherDetails(supabaseClient, employeeId, clientId, emp);

    if (Array.isArray(emp.moduleAccessPayload)) {
      await handleEmployeeModuleAccess(supabaseClient, employeeId, emp.moduleAccessPayload);
    }
  }
 
 
  return new Response(
    JSON.stringify({
      success: true,
      received: employees.length,
      inserted: insertedEmployees.length,
      skipped: errors.length,
      errors,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleCreate(supabaseClient: any, employee: any) {
  const clientId = employee.clientId || employee.client_id;
  
  console.log("Creating employee with clientId:", clientId);
  
  // Check for duplicate email within the same client (only if email is provided)
  if (employee.email) {
    console.log("Checking for existing email", employee.email, "for client", clientId);
    const { data: existingEmailEmployee, error: emailCheckError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('email', employee.email)
      .eq('client_id', clientId)
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking for existing employee email:", emailCheckError);
      return new Response(
        JSON.stringify({ error: "Error checking for existing employee email" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Email", employee.email, "exists for client", clientId + ":", !!existingEmailEmployee);

    if (existingEmailEmployee) {
      const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMAIL"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
 
  // Check for duplicate Employee ID within the same client
  console.log("Checking for existing employee ID", employee.employeeId, "for client", clientId);
  const { data: existingEmployeeIdEmployee, error: employeeIdCheckError } = await supabaseClient
    .from('employees')
    .select('id')
    .eq('employee_id', employee.employeeId)
    .eq('client_id', clientId)
    .maybeSingle();
 
  if (employeeIdCheckError) {
    console.error("Error checking for existing employee ID:", employeeIdCheckError);
    return new Response(
      JSON.stringify({ error: "Error checking for existing employee ID" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  console.log("Employee ID", employee.employeeId, "exists for client", clientId + ":", !!existingEmployeeIdEmployee);
 
  if (existingEmployeeIdEmployee) {
    const errorMessage = `An employee with Employee ID ${employee.employeeId} already exists for this client.`;
    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: "DUPLICATE_EMPLOYEE_ID"
      }),
      {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  // Map employee_type and department only when explicitly provided (omit or empty = null)
  const hasEmployeeType = employee.employeeType !== undefined && employee.employeeType !== null && String(employee.employeeType).trim() !== '';
  const hasDepartment = employee.department !== undefined && employee.department !== null && String(employee.department).trim() !== '';
  const employeeTypeId = hasEmployeeType ? await getEmployeeTypeId(supabaseClient, employee.employeeType) : null;
  const departmentId = hasDepartment ? await getDepartmentId(supabaseClient, employee.department) : null;
  const processedDocuments = await uploadEmployeeProfileDocuments(
    supabaseClient,
    clientId,
    employee.employeeId || 'unknown-employee',
    Array.isArray(employee.documents) ? employee.documents : []
  );

  // Create employee record
  const employeeData = {
    employee_id: employee.employeeId,
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email || null,
    phone: employee.phone || null,
    designation: employee.designation || null,
    employee_type: employeeTypeId,
    department: departmentId,
    joining_date: employee.joiningDate,
    status: true,
    client_id: clientId,
    user_id: employee.user_id || null,
    is_super_admin: employee.is_super_admin || false,
    is_cpd_involved: employee.is_cpd_involved === true,
    documents: processedDocuments
  };
 
  console.log("Creating employee with data:", employeeData);
 
  const { data: newEmployee, error: createError } = await supabaseClient
    .from('employees')
    .insert(employeeData)
    .select('*')
    .single();
 
  if (createError) {
    console.error("Error creating employee:", createError);
    
    // Handle database-level constraint violations
    if (createError.message.includes('duplicate') && createError.message.includes('email')) {
      const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMAIL"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (createError.message.includes('duplicate') && createError.message.includes('employee_id')) {
      const errorMessage = `An employee with Employee ID ${employee.employeeId} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMPLOYEE_ID"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Failed to create employee" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  console.log("Employee created successfully:", newEmployee);

  await insertEmployeePersonalDetails(supabaseClient, newEmployee.id, clientId, employee);
  await insertEmployeeOtherDetails(supabaseClient, newEmployee.id, clientId, employee);
 
  // Handle module access if provided
  if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload)) {
    await handleEmployeeModuleAccess(supabaseClient, newEmployee.id, employee.moduleAccessPayload);
  }
 
  return new Response(
    JSON.stringify({ data: newEmployee }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
 
async function handleUpdate(supabaseClient: any, employee: any) {
  const clientId = employee.clientId || employee.client_id;
  
  console.log("Updating employee with ID:", employee.id, "clientId:", clientId);
 
  // Check for duplicate email within the same client (excluding current employee, only if email is provided)
  if (employee.email) {
    console.log("Checking for existing email", employee.email, "for client", clientId);
    const { data: existingEmailEmployee, error: emailCheckError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('email', employee.email)
      .eq('client_id', clientId)
      .neq('id', employee.id)
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking for existing employee email:", emailCheckError);
      return new Response(
        JSON.stringify({ error: "Error checking for existing employee email" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Email", employee.email, "exists for client", clientId + ":", !!existingEmailEmployee);

    if (existingEmailEmployee) {
      const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMAIL"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
 
  // Check for duplicate Employee ID within the same client (excluding current employee)
  if (employee.employeeId) {
    console.log("Checking for existing employee ID", employee.employeeId, "for client", clientId);
    const { data: existingEmployeeIdEmployee, error: employeeIdCheckError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('employee_id', employee.employeeId)
      .eq('client_id', clientId)
      .neq('id', employee.id)
      .maybeSingle();
 
    if (employeeIdCheckError) {
      console.error("Error checking for existing employee ID:", employeeIdCheckError);
      return new Response(
        JSON.stringify({ error: "Error checking for existing employee ID" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
 
    console.log("Employee ID", employee.employeeId, "exists for client", clientId + ":", !!existingEmployeeIdEmployee);
 
    if (existingEmployeeIdEmployee) {
      const errorMessage = `An employee with Employee ID ${employee.employeeId} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMPLOYEE_ID"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
 
  // Map employee_type and department only when explicitly provided (omit or empty = null)
  const hasEmployeeType = employee.employeeType !== undefined && employee.employeeType !== null && String(employee.employeeType).trim() !== '';
  const hasDepartment = employee.department !== undefined && employee.department !== null && String(employee.department).trim() !== '';
  const employeeTypeId = hasEmployeeType ? await getEmployeeTypeId(supabaseClient, employee.employeeType) : null;
  const departmentId = hasDepartment ? await getDepartmentId(supabaseClient, employee.department) : null;
  const processedDocuments = await uploadEmployeeProfileDocuments(
    supabaseClient,
    clientId,
    employee.employeeId || employee.id || 'unknown-employee',
    Array.isArray(employee.documents) ? employee.documents : []
  );

  // Update employee record (nullable employee_type and department)
  const updateData: any = {
    first_name: employee.firstName,
    last_name: employee.lastName,
    phone: employee.phone || null,
    designation: employee.designation || null,
    joining_date: employee.joiningDate,
    employee_type: employeeTypeId,
    department: departmentId
  };
  if (employee.email !== undefined) {
    updateData.email = employee.email || null;
  }
  if (employee.employeeId) {
    updateData.employee_id = employee.employeeId;
  }
  if (employee.is_cpd_involved !== undefined) {
    updateData.is_cpd_involved = employee.is_cpd_involved === true;
  }
  if (employee.documents !== undefined) {
    updateData.documents = processedDocuments;
  }
 
  console.log("Update data:", updateData);
 
  const { data: updatedEmployee, error: updateError } = await supabaseClient
    .from('employees')
    .update(updateData)
    .eq('id', employee.id)
    .select('*')
    .single();
 
  if (updateError) {
    console.error("Error updating employee:", updateError);
    
    // Handle database-level constraint violations
    if (updateError.message.includes('duplicate') && updateError.message.includes('email')) {
      const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMAIL"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (updateError.message.includes('duplicate') && updateError.message.includes('employee_id')) {
      const errorMessage = `An employee with Employee ID ${employee.employeeId} already exists for this client.`;
      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: "DUPLICATE_EMPLOYEE_ID"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Failed to update employee" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  console.log("Employee updated successfully:", updatedEmployee);

  await insertEmployeePersonalDetails(supabaseClient, employee.id, clientId, employee);
  await insertEmployeeOtherDetails(supabaseClient, employee.id, clientId, employee);
 
  // Handle module access update if provided
  if (employee.moduleAccessPayload !== undefined) {
    await handleEmployeeModuleAccess(supabaseClient, employee.id, employee.moduleAccessPayload);
  } else {
    console.log("No moduleAccessPayload provided, skipping module update");
  }
 
  return new Response(
    JSON.stringify({ data: updatedEmployee }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
async function handleEmployeeModuleAccess(supabaseClient: any, employeeId: string, moduleAccessPayload: any[]) {
  try {
    // First, delete all existing module access for this employee
    console.log("Deleting all module access for employee:", employeeId);
    const { error: deleteError } = await supabaseClient
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);
 
    if (deleteError) {
      console.error("Error deleting existing module access:", deleteError);
      return;
    }
 
    console.log("Successfully deleted all module access for employee:", employeeId);
 
    if (moduleAccessPayload && moduleAccessPayload.length > 0) {
      const moduleEntries = moduleAccessPayload
        .filter(moduleAccess => !!moduleAccess.module_id)
        .map(moduleAccess => {
          let isAdmin = false;
 
          if (moduleAccess.level?.is_admin === true) {
            isAdmin = true;
          }
          
          const moduleId = moduleAccess.module_id;
 
          if (!moduleId) {
            console.error("Module entry missing module_id:", moduleAccess);
            return null;
          }
 
          return {
            employee_id: employeeId,
            module_id: moduleId,
            level: { is_admin: isAdmin }
          };
        })
        .filter(entry => entry !== null);
 
    console.log("Adding module entries:", moduleEntries);
 
      if (moduleEntries.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('employee_modules')
          .insert(moduleEntries);
 
        if (insertError) {
          console.error("Error inserting module entries:", insertError);
          return;
        }
 
        console.log("Successfully added module access for employee:", employeeId);
      } else {
        console.log("No enabled modules to add for employee:", employeeId);
      }
    } else {
      console.log("No module access payload or empty array provided for employee:", employeeId);
    }
  } catch (error) {
    console.error("Error updating module access:", error);
  }
}
 
async function handleDelete(supabaseClient: any, employeeId: string) {
  console.log("Deleting employee with ID:", employeeId);
 
  // First, delete all module permissions for this employee
  const { error: moduleError } = await supabaseClient
    .from('employee_modules')
    .delete()
    .eq('employee_id', employeeId);
 
  if (moduleError) {
    console.error("Error deleting employee module permissions:", moduleError);
  }
 
  // Then delete the employee
  const { error: deleteError } = await supabaseClient
    .from('employees')
    .delete()
    .eq('id', employeeId);
 
  if (deleteError) {
    console.error("Error deleting employee:", deleteError);
    return new Response(
      JSON.stringify({ error: "Failed to delete employee" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
 
async function handleDeactivate(supabaseClient: any, employeeId: string) {
  console.log("Deactivating employee with ID:", employeeId);
 
  const { data: deactivatedEmployee, error: deactivateError } = await supabaseClient
    .from('employees')
    .update({ status: false })
    .eq('id', employeeId)
    .select('*')
    .single();
 
  if (deactivateError) {
    console.error("Error deactivating employee:", deactivateError);
    return new Response(
      JSON.stringify({ error: "Failed to deactivate employee" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  // Clear all module permissions for deactivated employee
  const { error: moduleError } = await supabaseClient
    .from('employee_modules')
    .delete()
    .eq('employee_id', employeeId);
 
  if (moduleError) {
    console.error("Error removing module permissions:", moduleError);
  }
 
  return new Response(
    JSON.stringify({ data: deactivatedEmployee }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
 
async function handleReactivate(supabaseClient: any, employeeId: string) {
  console.log("Reactivating employee with ID:", employeeId);
 
  const { data: reactivatedEmployee, error: reactivateError } = await supabaseClient
    .from('employees')
    .update({ status: true })
    .eq('id', employeeId)
    .select('*')
    .single();
 
  if (reactivateError) {
    console.error("Error reactivating employee:", reactivateError);
    return new Response(
      JSON.stringify({ error: "Failed to reactivate employee" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
 
  return new Response(
    JSON.stringify({ data: reactivatedEmployee }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
 