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

async function handleBulkImport(supabaseClient: any, employees: any[], clientId: string) {
  console.log("Processing bulk import for", employees?.length, "employees with clientId:", clientId);
  
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return new Response(
      JSON.stringify({ 
        error: "Invalid employees data",
        details: "Employees array is required and must not be empty"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const result = {
    success: true,
    created: 0,
    updated: 0,
    errors: [],
    employees: []
  };

  // Process employees in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(employees.length/batchSize)}`);
    
    for (const emp of batch) {
      try {
        // Check for duplicate email within the same client
        const { data: existingEmailEmployee } = await supabaseClient
          .from('employees')
          .select('id')
          .eq('email', emp.email)
          .eq('client_id', clientId)
          .maybeSingle();

        if (existingEmailEmployee) {
          result.errors.push(`Employee with email ${emp.email} already exists`);
          continue;
        }

        // Check for duplicate Employee ID within the same client
        const { data: existingEmployeeIdEmployee } = await supabaseClient
          .from('employees')
          .select('id')
          .eq('employee_id', emp.employeeId)
          .eq('client_id', clientId)
          .maybeSingle();

        if (existingEmployeeIdEmployee) {
          result.errors.push(`Employee with ID ${emp.employeeId} already exists`);
          continue;
        }

        // Create employee record
        const employeeData = {
          employee_id: emp.employeeId,
          first_name: emp.firstName,
          last_name: emp.lastName,
          email: emp.email,
          employee_type: emp.employeeType,
          department: emp.department,
          joining_date: emp.joiningDate,
          status: true,
          phone: emp.phone || null,
          client_id: clientId,
          user_id: emp.user_id || null,
          is_super_admin: emp.is_super_admin || false
        };

        const { data: newEmployee, error: createError } = await supabaseClient
          .from('employees')
          .insert(employeeData)
          .select('*')
          .single();

        if (createError) {
          console.error("Error creating employee:", createError);
          result.errors.push(`Failed to create employee ${emp.employeeId}: ${createError.message}`);
          continue;
        }

        result.created++;
        result.employees.push(newEmployee);

        // Handle module access if provided
        if (emp.moduleAccessPayload && Array.isArray(emp.moduleAccessPayload)) {
          await handleEmployeeModuleAccess(supabaseClient, newEmployee.id, emp.moduleAccessPayload);
        }

      } catch (empError) {
        console.error("Error processing employee:", empError);
        result.errors.push(`Error processing employee ${emp.employeeId}: ${empError.message}`);
      }
    }
  }

  console.log("Bulk import completed:", result);

  return new Response(
    JSON.stringify(result),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleCreate(supabaseClient: any, employee: any) {
  const clientId = employee.clientId || employee.client_id;
  
  console.log("Creating employee with clientId:", clientId);
  
  // Check for duplicate email within the same client
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

  // Create employee record
  const employeeData = {
    employee_id: employee.employeeId,
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    phone: employee.phone || null,
    designation: employee.designation || null,
    employee_type: employee.employeeType,
    department: employee.department,
    joining_date: employee.joiningDate,
    status: true,
    client_id: clientId,
    user_id: employee.user_id || null,
    is_super_admin: employee.is_super_admin || false
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

  // Check for duplicate email within the same client (excluding current employee)
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

  // Update employee record
  const updateData = {
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    phone: employee.phone || null,
    designation: employee.designation || null,
    employee_type: employee.employeeType,
    joining_date:employee.joiningDate,
    department: employee.department
  };

  // Only include employee_id in update if it's provided
  if (employee.employeeId) {
    updateData.employee_id = employee.employeeId;
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
        .filter(moduleAccess => moduleAccess.enabled === true) // Only include enabled modules
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
